<?php
// 1. Header CORS & Content Type
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");
header("Content-Type: application/json; charset=UTF-8");

// 2. Kunci Penanganan Preflight Request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. Koneksi Database
$conn = new mysqli("localhost", "root", "", "chandra_mall");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Koneksi database gagal: " . $conn->connect_error]);
    exit;
}

$conn->set_charset("utf8mb4");

// 4. Membaca Input (Bisa dari GET Query / JSON Body)
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? '';

function fail($code, $message) {
    http_response_code($code);
    echo json_encode(["error" => $message]);
    exit;
}

// ==========================================
// 5. ACTION LOGIN
// ==========================================
if ($action === 'login') {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "Email dan password wajib diisi"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND is_active = 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    // Memeriksa password (Bcrypt Hash ATAU Plaintext Match sebagai fallback)
    $isPasswordValid = $user && (password_verify($password, $user['password_hash']) || $password === $user['password_hash']);

    if ($isPasswordValid) {
        unset($user['password_hash']);
        echo json_encode($user);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Email atau password salah"]);
    }
    exit;
}

// ==========================================
// 5B. ACTION REGISTER
// ==========================================
elseif ($action === 'register') {
    $name = trim((string)($input['name'] ?? ''));
    $email = trim((string)($input['email'] ?? ''));
    $phone = trim((string)($input['phone'] ?? ''));
    $password = (string)($input['password'] ?? '');

    if ($name === '' || $email === '' || $password === '') {
        fail(400, 'Nama, email, dan password wajib diisi');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail(400, 'Format email tidak valid');
    }
    if (strlen($password) < 6) {
        fail(400, 'Password minimal 6 karakter');
    }

    $check = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $check->bind_param("s", $email);
    $check->execute();
    $exists = $check->get_result()->fetch_assoc();
    if ($exists) {
        fail(409, 'Email sudah terdaftar');
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $conn->prepare(
        "INSERT INTO users (name, email, phone, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'buyer', 1)"
    );
    $stmt->bind_param("ssss", $name, $email, $phone, $hash);
    if (!$stmt->execute()) {
        fail(500, 'Registrasi gagal diproses');
    }

    $userId = $stmt->insert_id;
    echo json_encode([
        "id" => $userId,
        "name" => $name,
        "email" => $email,
        "phone" => $phone,
        "role" => "buyer"
    ]);
    exit;
}

// ==========================================
// 6. ACTION PRODUCTS
// ==========================================
elseif ($action === 'products') {
    $q = $conn->real_escape_string($_GET['q'] ?? '');
    $categorySlug = $conn->real_escape_string($_GET['category'] ?? '');
    $vendorSlug = $conn->real_escape_string($_GET['vendor'] ?? '');
    $minPrice = isset($_GET['min_price']) && is_numeric($_GET['min_price']) ? (float)$_GET['min_price'] : null;
    $maxPrice = isset($_GET['max_price']) && is_numeric($_GET['max_price']) ? (float)$_GET['max_price'] : null;
    $inStockOnly = ($_GET['in_stock'] ?? '') === '1';
    $verifiedOnly = ($_GET['verified_only'] ?? '') === '1';
    $exportableOnly = ($_GET['exportable_only'] ?? '') === '1';
    $sort = $_GET['sort'] ?? 'newest';

    $sql = "SELECT p.id, p.name, p.slug, p.price, p.stock, p.description, p.unit, p.weight_grams, p.is_exportable,
                   p.vendor_id, p.category_id,
                   c.name AS category_name, c.slug AS category_slug,
                   v.store_name AS vendor_name, v.slug AS vendor_slug, v.is_verified AS vendor_is_verified, v.rating_avg AS vendor_rating,
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
    if ($verifiedOnly) $sql .= " AND v.is_verified = 1";
    if ($exportableOnly) $sql .= " AND p.is_exportable = 1";

    if ($sort === 'price_asc') $sql .= " ORDER BY p.price ASC, p.id DESC";
    elseif ($sort === 'price_desc') $sql .= " ORDER BY p.price DESC, p.id DESC";
    else $sql .= " ORDER BY p.created_at DESC";

    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

// ==========================================
// 7. ACTION PRODUCT DETAIL
// ==========================================
elseif ($action === 'product') {
    $id = (int)($_GET['id'] ?? 0);
    $result = $conn->query(
        "SELECT p.*, c.name AS category_name, c.slug AS category_slug,
                v.store_name AS vendor_name, v.slug AS vendor_slug, v.id AS vendor_id,
                v.is_verified AS vendor_is_verified, v.rating_avg AS vendor_rating,
                v.origin_city AS vendor_origin_city, v.logo_url AS vendor_logo
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN vendors v ON v.id = p.vendor_id
         WHERE p.id = $id"
    );
    $product = $result ? $result->fetch_assoc() : null;
    if (!$product) { echo json_encode(["error" => "Produk tidak ditemukan"]); exit; }

    $img = $conn->query("SELECT image_url FROM product_images WHERE product_id = $id ORDER BY sort_order");
    $images = [];
    while ($row = $img->fetch_assoc()) $images[] = $row['image_url'];
    $product['images'] = $images;

    echo json_encode($product);
}

// ==========================================
// 8. ACTION REVIEWS
// ==========================================
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

    $distributionResult = $conn->query(
        "SELECT rating, COUNT(*) AS rating_count
         FROM reviews
         WHERE product_id = $productId AND rating BETWEEN 1 AND 5
         GROUP BY rating"
    );
    $distribution = ["1" => 0, "2" => 0, "3" => 0, "4" => 0, "5" => 0];
    if ($distributionResult) {
        while ($row = $distributionResult->fetch_assoc()) {
            $distribution[(string)$row['rating']] = (int)$row['rating_count'];
        }
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

    $reviews = [];
    if ($reviewsResult) {
        while ($row = $reviewsResult->fetch_assoc()) $reviews[] = $row;
    }

    if ($summary) {
        $summary['average_rating'] = round((float)$summary['average_rating'], 1);
        $summary['rating_count'] = (int)$summary['rating_count'];
        $summary['review_count'] = (int)$summary['review_count'];
        $summary['distribution'] = $distribution;
    }

    echo json_encode(["summary" => $summary, "reviews" => $reviews]);
}

// ==========================================
// 9. ACTION CATEGORIES & VENDORS
// ==========================================
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

// ==========================================
// 10. ACTION CART & WISHLIST
// ==========================================
elseif ($action === 'cart') {
    $userId = (int)($_GET['user_id'] ?? 0);
    if ($userId <= 0) fail(400, 'user_id tidak valid');
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
    $userId = (int)($input['user_id'] ?? 0);
    $productId = (int)($input['product_id'] ?? 0);
    $qty = (int)($input['quantity'] ?? 1);

    if ($userId <= 0 || $productId <= 0 || $qty < 1) {
        echo json_encode(["error" => "Data keranjang tidak valid"]); exit;
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
    $userId = (int)($input['user_id'] ?? 0);
    $productId = (int)($input['product_id'] ?? 0);
    $qty = (int)($input['quantity'] ?? 0);

    if ($userId <= 0 || $productId <= 0 || $qty < 1) {
        fail(400, 'Data update keranjang tidak valid');
    }

    $stockResult = $conn->query("SELECT stock FROM products WHERE id = $productId LIMIT 1");
    $stockRow = $stockResult ? $stockResult->fetch_assoc() : null;
    if (!$stockRow) {
        fail(404, 'Produk tidak ditemukan');
    }
    if ($qty > (int)$stockRow['stock']) {
        fail(400, 'Jumlah melebihi stok produk');
    }

    $updated = $conn->query(
        "UPDATE cart_items SET quantity = $qty WHERE user_id = $userId AND product_id = $productId"
    );
    if (!$updated || $conn->affected_rows < 1) {
        fail(404, 'Item keranjang tidak ditemukan');
    }

    echo json_encode(["message" => "Jumlah keranjang diperbarui"]);
}

elseif ($action === 'remove_cart') {
    $userId = (int)($_GET['user_id'] ?? $input['user_id'] ?? 0);
    $productId = (int)($_GET['product_id'] ?? $input['product_id'] ?? 0);
    $conn->query("DELETE FROM cart_items WHERE user_id = $userId AND product_id = $productId");
    echo json_encode(["message" => "Dihapus"]);
}

elseif ($action === 'wishlist') {
    $userId = (int)($_GET['user_id'] ?? 0);
    if ($userId <= 0) fail(400, 'user_id tidak valid');

    $result = $conn->query(
        "SELECT wi.product_id,
                p.name,
                p.price,
                p.stock,
                v.store_name AS vendor_name,
                (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order LIMIT 1) AS image_url
         FROM wishlist_items wi
         JOIN products p ON p.id = wi.product_id
         LEFT JOIN vendors v ON v.id = p.vendor_id
         WHERE wi.user_id = $userId AND p.is_active = 1
         ORDER BY wi.created_at DESC"
    );

    $data = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) $data[] = $row;
    }
    echo json_encode($data);
}

elseif ($action === 'add_wishlist') {
    $userId = (int)($input['user_id'] ?? 0);
    $productId = (int)($input['product_id'] ?? 0);
    if ($userId <= 0 || $productId <= 0) {
        fail(400, 'Data wishlist tidak valid');
    }

    $conn->query(
        "INSERT INTO wishlist_items (user_id, product_id)
         VALUES ($userId, $productId)
         ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP()"
    );
    echo json_encode(["message" => "Wishlist diperbarui"]);
}

elseif ($action === 'remove_wishlist') {
    $userId = (int)($_GET['user_id'] ?? $input['user_id'] ?? 0);
    $productId = (int)($_GET['product_id'] ?? $input['product_id'] ?? 0);
    if ($userId <= 0 || $productId <= 0) {
        fail(400, 'Data wishlist tidak valid');
    }
    $conn->query("DELETE FROM wishlist_items WHERE user_id = $userId AND product_id = $productId");
    echo json_encode(["message" => "Dihapus dari wishlist"]);
}

// ==========================================
// 11. ACTION HK STORES & ORDERS
// ==========================================
elseif ($action === 'hk_stores') {
    $result = $conn->query("SELECT id, name, district, address_line, phone, opening_hours FROM hk_stores WHERE is_active = 1 ORDER BY district, name");
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode($data);
}

elseif ($action === 'orders') {
    $userId = (int)($_GET['user_id'] ?? 0);
    $result = $conn->query(
        "SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
                hs.name AS hk_store_name, hs.district AS hk_store_district,
                hs.address_line AS hk_store_address, hs.phone AS hk_store_phone
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
        fail(400, 'Data order tidak valid');
    }

    $check = $conn->query(
        "SELECT id FROM orders WHERE id = $orderId AND buyer_id = $userId LIMIT 1"
    );
    $order = $check ? $check->fetch_assoc() : null;
    if (!$order) {
        fail(404, 'Pesanan tidak ditemukan');
    }

    $result = $conn->query(
        "SELECT oi.id,
                oi.product_id,
                oi.product_name_snapshot AS product_name,
                oi.price_snapshot AS price,
                oi.quantity,
                oi.subtotal,
                oi.notes_snapshot AS notes,
                v.store_name AS vendor_name,
                ovg.status AS vendor_status,
                (SELECT image_url FROM product_images pi WHERE pi.product_id = oi.product_id ORDER BY sort_order LIMIT 1) AS image_url
         FROM order_vendor_groups ovg
         JOIN order_items oi ON oi.order_vendor_group_id = ovg.id
         LEFT JOIN vendors v ON v.id = ovg.vendor_id
         WHERE ovg.order_id = $orderId
         ORDER BY oi.id ASC"
    );

    $data = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) $data[] = $row;
    }
    echo json_encode($data);
}

elseif ($action === 'order_tracking') {
    $userId = (int)($_GET['user_id'] ?? 0);
    $orderId = (int)($_GET['order_id'] ?? 0);
    if ($userId <= 0 || $orderId <= 0) {
        fail(400, 'Data order tidak valid');
    }

    $orderStmt = $conn->prepare(
        "SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_deadline, o.paid_at, o.created_at,
                hs.id AS hk_store_id, hs.name AS hk_store_name, hs.district AS hk_store_district,
                hs.address_line AS hk_store_address, hs.phone AS hk_store_phone, hs.opening_hours AS hk_store_hours
         FROM orders o
         LEFT JOIN hk_stores hs ON hs.id = o.hk_store_id
         WHERE o.id = ? AND o.buyer_id = ? LIMIT 1"
    );
    $orderStmt->bind_param("ii", $orderId, $userId);
    $orderStmt->execute();
    $order = $orderStmt->get_result()->fetch_assoc();
    if (!$order) {
        fail(404, 'Pesanan tidak ditemukan');
    }

    $groupRes = $conn->query(
        "SELECT ovg.id, ovg.vendor_id, ovg.status, ovg.subtotal_amount, ovg.courier_name, ovg.tracking_number,
                ovg.shipped_at, ovg.arrived_at_store_at, ovg.picked_up_at,
                v.store_name AS vendor_name, v.origin_city AS vendor_origin_city
         FROM order_vendor_groups ovg
         LEFT JOIN vendors v ON v.id = ovg.vendor_id
         WHERE ovg.order_id = $orderId"
    );
    $groups = [];
    if ($groupRes) {
        while ($g = $groupRes->fetch_assoc()) {
            $gid = (int)$g['id'];
            $itemsRes = $conn->query(
                "SELECT oi.*, (SELECT image_url FROM product_images pi WHERE pi.product_id = oi.product_id ORDER BY sort_order LIMIT 1) AS image_url
                 FROM order_items oi WHERE oi.order_vendor_group_id = $gid"
            );
            $items = [];
            if ($itemsRes) {
                while ($it = $itemsRes->fetch_assoc()) $items[] = $it;
            }
            $g['items'] = $items;

            $logsRes = $conn->query(
                "SELECT id, status, note, created_at FROM order_status_logs WHERE order_vendor_group_id = $gid ORDER BY created_at ASC"
            );
            $logs = [];
            if ($logsRes) {
                while ($l = $logsRes->fetch_assoc()) $logs[] = $l;
            }
            $g['status_logs'] = $logs;

            $groups[] = $g;
        }
    }

    echo json_encode([
        "order" => $order,
        "groups" => $groups
    ]);
}

elseif ($action === 'profile') {
    $userId = (int)($_GET['user_id'] ?? 0);
    if ($userId <= 0) fail(400, 'user_id tidak valid');

    $stmt = $conn->prepare(
        "SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = ? LIMIT 1"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user) {
        fail(404, 'User tidak ditemukan');
    }

    echo json_encode($user);
}

// ==========================================
// 12. ACTION CHECKOUT
// ==========================================
elseif ($action === 'checkout') {
    $userId = (int)($input['user_id'] ?? 0);
    $hkStoreId = (int)($input['hk_store_id'] ?? 0);

    $items = [];
    $res = $conn->query(
        "SELECT ci.product_id, ci.quantity, ci.notes, p.price, p.vendor_id, p.name
         FROM cart_items ci JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = $userId"
    );
    while ($row = $res->fetch_assoc()) $items[] = $row;

    if (!$items) { echo json_encode(["error" => "Keranjang kosong"]); exit; }

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
        
        // Perhitungan komisi platform 5% & net vendor
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
    http_response_code(400);
    echo json_encode(["error" => "Action tidak dikenal"]);
}

$conn->close();
?>