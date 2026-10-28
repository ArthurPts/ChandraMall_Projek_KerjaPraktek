<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "chandra_mall");

if ($conn->connect_error) {
    echo json_encode(["error" => "Koneksi gagal"]);
    exit;
}

$conn->set_charset("utf8mb4");
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents("php://input"), true) ?? [];

if ($action === 'login') {
    $email = $conn->real_escape_string($input['email'] ?? '');
    $password = $conn->real_escape_string($input['password'] ?? '');
    $result = $conn->query("SELECT id, name, email, role FROM users WHERE email = '$email' AND password_hash = '$password' AND is_active = 1");
    $user = $result->fetch_assoc();
    if ($user) {
        echo json_encode($user);
    } else {
        echo json_encode(["error" => "Email atau password salah"]);
    }
}

elseif ($action === 'products') {
    $q = $conn->real_escape_string($_GET['q'] ?? '');
    $categorySlug = $conn->real_escape_string($_GET['category'] ?? '');
    $vendorSlug = $conn->real_escape_string($_GET['vendor'] ?? '');
    $minPrice = isset($_GET['min_price']) && is_numeric($_GET['min_price']) ? (float)$_GET['min_price'] : null;
    $maxPrice = isset($_GET['max_price']) && is_numeric($_GET['max_price']) ? (float)$_GET['max_price'] : null;
    $inStockOnly = ($_GET['in_stock'] ?? '') === '1';
    $sort = $_GET['sort'] ?? 'newest';
    $sql = "SELECT p.id, p.name, p.slug, p.price, p.stock, p.description,
                   p.vendor_id, p.category_id,
                   c.name AS category_name, c.slug AS category_slug,
                   v.store_name AS vendor_name, v.slug AS vendor_slug,
                   (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order LIMIT 1) AS image_url
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN vendors v ON v.id = p.vendor_id
            WHERE p.is_active = 1";
    if ($q) $sql .= " AND p.name LIKE '%$q%'";
    if ($categorySlug) $sql .= " AND c.slug = '$categorySlug'";
    if ($vendorSlug) $sql .= " AND v.slug = '$vendorSlug'";
    if ($minPrice !== null) $sql .= " AND p.price >= " . $minPrice;
    if ($maxPrice !== null) $sql .= " AND p.price <= " . $maxPrice;
    if ($inStockOnly) $sql .= " AND p.stock > 0";
    if ($sort === 'price_asc') $sql .= " ORDER BY p.price ASC, p.id DESC";
    elseif ($sort === 'price_desc') $sql .= " ORDER BY p.price DESC, p.id DESC";
    else $sql .= " ORDER BY p.created_at DESC";
    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'product') {
    $id = (int)($_GET['id'] ?? 0);
    $result = $conn->query(
        "SELECT p.*, c.name AS category_name, c.slug AS category_slug,
                v.store_name AS vendor_name, v.slug AS vendor_slug, v.id AS vendor_id
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN vendors v ON v.id = p.vendor_id
         WHERE p.id = $id"
    );
    $product = $result->fetch_assoc();
    if (!$product) { echo json_encode(["error" => "Produk tidak ditemukan"]); exit; }

    $img = $conn->query("SELECT image_url FROM product_images WHERE product_id = $id ORDER BY sort_order");
    $images = [];
    while ($row = $img->fetch_assoc()) $images[] = $row['image_url'];
    $product['images'] = $images;

    echo json_encode($product);
}

elseif ($action === 'reviews') {
    $productId = filter_var($_GET['product_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$productId || $productId < 1) {
        http_response_code(400);
        echo json_encode(["error" => "ID produk tidak valid"]);
        exit;
    }

    $summaryResult = $conn->query(
        "SELECT COUNT(*) AS rating_count,
                COALESCE(AVG(rating), 0) AS average_rating,
                COALESCE(SUM(comment IS NOT NULL AND CHAR_LENGTH(TRIM(comment)) > 0), 0) AS review_count
         FROM reviews
         WHERE product_id = $productId AND rating BETWEEN 1 AND 5"
    );
    $summary = $summaryResult ? $summaryResult->fetch_assoc() : null;
    if (!$summary) {
        http_response_code(500);
        echo json_encode(["error" => "Ulasan produk tidak dapat dimuat"]);
        exit;
    }

    $distributionResult = $conn->query(
        "SELECT rating, COUNT(*) AS rating_count
         FROM reviews
         WHERE product_id = $productId AND rating BETWEEN 1 AND 5
         GROUP BY rating"
    );
    if (!$distributionResult) {
        http_response_code(500);
        echo json_encode(["error" => "Ringkasan rating tidak dapat dimuat"]);
        exit;
    }
    $distribution = ["1" => 0, "2" => 0, "3" => 0, "4" => 0, "5" => 0];
    while ($row = $distributionResult->fetch_assoc()) {
        $distribution[(string)$row['rating']] = (int)$row['rating_count'];
    }

    $reviewsResult = $conn->query(
        "SELECT r.id, r.rating, r.comment, r.created_at,
                CASE
                    WHEN u.name IS NULL OR TRIM(u.name) = '' THEN 'Pembeli'
                    ELSE CONCAT(LEFT(TRIM(u.name), 1), '***')
                END AS buyer_name
         FROM reviews r
         LEFT JOIN users u ON u.id = r.buyer_id
         WHERE r.product_id = $productId AND r.rating BETWEEN 1 AND 5
         ORDER BY r.created_at DESC, r.id DESC
         LIMIT 50"
    );
    if (!$reviewsResult) {
        http_response_code(500);
        echo json_encode(["error" => "Daftar ulasan tidak dapat dimuat"]);
        exit;
    }

    $reviews = [];
    while ($row = $reviewsResult->fetch_assoc()) $reviews[] = $row;
    $summary['average_rating'] = round((float)$summary['average_rating'], 1);
    $summary['rating_count'] = (int)$summary['rating_count'];
    $summary['review_count'] = (int)$summary['review_count'];
    $summary['distribution'] = $distribution;
    echo json_encode(["summary" => $summary, "reviews" => $reviews]);
}

elseif ($action === 'categories') {
    $result = $conn->query("SELECT id, name, slug, icon FROM categories ORDER BY name");
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'vendors') {
    $result = $conn->query(
        "SELECT id, store_name, slug, description, logo_url, origin_city, rating_avg, rating_count
         FROM vendors WHERE is_verified = 1 ORDER BY rating_avg DESC"
    );
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'cart') {
    $userId = (int)($_GET['user_id'] ?? 0);
    $result = $conn->query(
        "SELECT ci.quantity, ci.notes,
                p.id AS product_id, p.name, p.price, p.stock,
                (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) AS image_url,
                v.store_name AS vendor_name
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         LEFT JOIN vendors v ON v.id = p.vendor_id
         WHERE ci.user_id = $userId"
    );
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'add_cart') {
    $userId = (int)$input['user_id'];
    $productId = (int)$input['product_id'];
    $qty = (int)($input['quantity'] ?? 1);
    if ($userId <= 0 || $productId <= 0 || $qty < 1) {
        echo json_encode(["error" => "Data keranjang tidak valid"]); exit;
    }
    $productResult = $conn->query("SELECT stock FROM products WHERE id = $productId AND is_active = 1");
    $product = $productResult ? $productResult->fetch_assoc() : null;
    if (!$product) { echo json_encode(["error" => "Produk tidak tersedia"]); exit; }
    $existingResult = $conn->query(
        "SELECT quantity FROM cart_items WHERE user_id = $userId AND product_id = $productId"
    );
    $existing = $existingResult ? $existingResult->fetch_assoc() : null;
    if ((int)$product['stock'] < $qty + (int)($existing['quantity'] ?? 0)) {
        echo json_encode(["error" => "Stok tidak mencukupi"]); exit;
    }
    $notes = $conn->real_escape_string($input['notes'] ?? '');
    $conn->query(
        "INSERT INTO cart_items (user_id, product_id, quantity, notes)
         VALUES ($userId, $productId, $qty, '$notes')
         ON DUPLICATE KEY UPDATE quantity = quantity + $qty, notes = '$notes'"
    );
    echo json_encode(["message" => "Ditambahkan"]);
}

elseif ($action === 'update_cart') {
    $userId = (int)$input['user_id'];
    $productId = (int)$input['product_id'];
    $qty = (int)$input['quantity'];
    if ($userId <= 0 || $productId <= 0 || $qty < 1) {
        echo json_encode(["error" => "Data keranjang tidak valid"]); exit;
    }
    $productResult = $conn->query("SELECT stock FROM products WHERE id = $productId AND is_active = 1");
    $product = $productResult ? $productResult->fetch_assoc() : null;
    if (!$product) { echo json_encode(["error" => "Produk tidak tersedia"]); exit; }
    if ((int)$product['stock'] < $qty) {
        echo json_encode(["error" => "Stok tidak mencukupi"]); exit;
    }
    $conn->query("UPDATE cart_items SET quantity = $qty WHERE user_id = $userId AND product_id = $productId");
    echo json_encode(["message" => "Diperbarui"]);
}

elseif ($action === 'remove_cart') {
    $userId = (int)($_GET['user_id'] ?? 0);
    $productId = (int)($_GET['product_id'] ?? 0);
    $conn->query("DELETE FROM cart_items WHERE user_id = $userId AND product_id = $productId");
    echo json_encode(["message" => "Dihapus"]);
}

elseif ($action === 'wishlist') {
    $userId = (int)($_GET['user_id'] ?? 0);
    $result = $conn->query(
        "SELECT w.product_id, p.name, p.price,
                (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) AS image_url
         FROM wishlist_items w
         JOIN products p ON p.id = w.product_id
         WHERE w.user_id = $userId"
    );
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'add_wishlist') {
    $userId = (int)$input['user_id'];
    $productId = (int)$input['product_id'];
    $conn->query("INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES ($userId, $productId)");
    echo json_encode(["message" => "Ditambahkan"]);
}

elseif ($action === 'remove_wishlist') {
    $userId = (int)($_GET['user_id'] ?? 0);
    $productId = (int)($_GET['product_id'] ?? 0);
    $conn->query("DELETE FROM wishlist_items WHERE user_id = $userId AND product_id = $productId");
    echo json_encode(["message" => "Dihapus"]);
}

elseif ($action === 'hk_stores') {
    $result = $conn->query("SELECT id, name, district, address_line FROM hk_stores WHERE is_active = 1");
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'orders') {
    $userId = (int)($_GET['user_id'] ?? 0);
    $result = $conn->query(
        "SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
                hs.name AS hk_store_name, hs.district AS hk_store_district,
                hs.address_line AS hk_store_address
         FROM orders o
         LEFT JOIN hk_stores hs ON hs.id = o.hk_store_id
         WHERE o.buyer_id = $userId
         ORDER BY o.created_at DESC"
    );
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'order_details') {
    $userId = (int)($_GET['user_id'] ?? 0);
    $orderId = (int)($_GET['order_id'] ?? 0);
    if ($userId <= 0 || $orderId <= 0) {
        echo json_encode(["error" => "Pesanan tidak valid"]); exit;
    }
    $orderResult = $conn->query(
        "SELECT id FROM orders WHERE id = $orderId AND buyer_id = $userId LIMIT 1"
    );
    if (!$orderResult || !$orderResult->fetch_assoc()) {
        http_response_code(404);
        echo json_encode(["error" => "Pesanan tidak ditemukan"]); exit;
    }
    $result = $conn->query(
        "SELECT oi.id, oi.product_id, oi.product_name_snapshot AS product_name,
                oi.price_snapshot AS price, oi.quantity, oi.subtotal,
                oi.notes_snapshot AS notes, ovg.vendor_id,
                ovg.status AS vendor_status, v.store_name AS vendor_name,
                (SELECT image_url FROM product_images pi
                 WHERE pi.product_id = oi.product_id ORDER BY pi.sort_order LIMIT 1) AS image_url
         FROM order_vendor_groups ovg
         JOIN order_items oi ON oi.order_vendor_group_id = ovg.id
         LEFT JOIN vendors v ON v.id = ovg.vendor_id
         WHERE ovg.order_id = $orderId
         ORDER BY ovg.id, oi.id"
    );
    if (!$result) {
        http_response_code(500);
        echo json_encode(["error" => "Rincian pesanan tidak dapat dimuat"]); exit;
    }
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'checkout') {
    $userId = (int)$input['user_id'];
    $hkStoreId = (int)$input['hk_store_id'];

    $items = [];
    $res = $conn->query(
        "SELECT ci.product_id, ci.quantity, ci.notes, p.price, p.vendor_id, p.name
         FROM cart_items ci JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = $userId"
    );
    while ($row = $res->fetch_assoc()) $items[] = $row;

    if (!$items) { echo json_encode(["error" => "Keranjang kosong"]); exit; }
    foreach ($items as $it) {
        $productId = (int)$it['product_id'];
        $stockResult = $conn->query("SELECT stock FROM products WHERE id = $productId FOR UPDATE");
        $stockRow = $stockResult ? $stockResult->fetch_assoc() : null;
        if (!$stockRow || (int)$stockRow['stock'] < (int)$it['quantity']) {
            http_response_code(409);
            echo json_encode(["error" => "Stok tidak mencukupi untuk " . $it['name']]); exit;
        }
    }

    $orderNumber = "ORD-" . date("Ymd") . "-" . rand(1000, 9999);
    $total = 0;
    foreach ($items as $it) $total += $it['price'] * $it['quantity'];
    $deadline = date("Y-m-d H:i:s", strtotime("+24 hours"));

    $conn->query(
        "INSERT INTO orders (order_number, buyer_id, hk_store_id, status, total_amount, payment_deadline)
         VALUES ('$orderNumber', $userId, $hkStoreId, 'pending_payment', $total, '$deadline')"
    );
    $orderId = $conn->insert_id;

    $groups = [];
    foreach ($items as $it) $groups[$it['vendor_id']][] = $it;

    foreach ($groups as $vendorId => $vendorItems) {
        $subtotal = 0;
        foreach ($vendorItems as $vi) $subtotal += $vi['price'] * $vi['quantity'];
        $fee = round($subtotal * 0.05, 2);
        $net = $subtotal - $fee;

        $conn->query(
            "INSERT INTO order_vendor_groups (order_id, vendor_id, status, subtotal_amount, platform_fee_amount, vendor_net_amount)
             VALUES ($orderId, $vendorId, 'pending_payment', $subtotal, $fee, $net)"
        );
        $groupId = $conn->insert_id;

        foreach ($vendorItems as $vi) {
            $sub = $vi['price'] * $vi['quantity'];
            $notes = $conn->real_escape_string($vi['notes'] ?? '');
            $name = $conn->real_escape_string($vi['name']);
            $conn->query(
                "INSERT INTO order_items (order_vendor_group_id, product_id, product_name_snapshot, price_snapshot, quantity, subtotal, notes_snapshot)
                 VALUES ($groupId, {$vi['product_id']}, '$name', {$vi['price']}, {$vi['quantity']}, $sub, '$notes')"
            );
            $conn->query("UPDATE products SET stock = stock - {$vi['quantity']} WHERE id = {$vi['product_id']}");
        }
    }

    $conn->query("DELETE FROM cart_items WHERE user_id = $userId");
    echo json_encode(["order_id" => $orderId, "order_number" => $orderNumber, "total" => $total]);
}

else {
    echo json_encode(["error" => "Action tidak dikenal"]);
}

$conn->close();
?>