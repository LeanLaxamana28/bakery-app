// App.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Image,
  Alert,
  Switch,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const BACKGROUND =
  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1470&q=80";
const STORAGE_KEY = "@bakery_products_v1";
const CART_KEY = "@bakery_cart_v1";
const THEME_KEY = "@bakery_theme_v1";
const ADMIN_PASSWORD = "admin123";
const CATEGORIES = ["Bread", "Cake", "Pastry", "Drinks", "Other"];

// ----------------- Theme Container -----------------
const ThemeContainer = ({ darkMode, children }) => (
  <ImageBackground source={{ uri: BACKGROUND }} style={styles.background}>
    <View style={[styles.overlay, darkMode ? styles.overlayDark : styles.overlayLight]} />
    <View style={styles.safeArea}>{children}</View>
  </ImageBackground>
);

// ----------------- Utility -----------------
function formatNumber(n) {
  return Number(n).toLocaleString();
}

// ----------------- Product Card -----------------
function ProductCard({ item, onEdit, onDelete, onAddToCart, darkMode, showStock = true }) {
  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Text style={styles.thumbnailText}>No Image</Text>
          </View>
        )}
        <View style={{ justifyContent: "center", flexShrink: 1 }}>
          <Text style={[styles.cardTitle, darkMode && styles.textLight]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cardSubtitle, darkMode && styles.textLight]}>
            {item.category} • ₱ {formatNumber(item.price)}
          </Text>
          {showStock && (
            <Text style={[styles.cardSubtitleSmall, darkMode && styles.textLight]}>
              Stock: {item.stock}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        {onEdit && (
          <TouchableOpacity style={styles.smallBtn} onPress={() => onEdit(item)}>
            <Text style={styles.smallBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.smallBtn, styles.deleteSmallBtn]}
            onPress={() => onDelete(item.id)}
          >
            <Text style={styles.smallBtnText}>Delete</Text>
          </TouchableOpacity>
        )}
        {onAddToCart && item.stock > 0 && (
          <TouchableOpacity
            style={[styles.smallBtn, styles.cartSmallBtn]}
            onPress={() => onAddToCart(item.id, 1)}
          >
            <Text style={styles.smallBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ----------------- Screens -----------------
function HomeScreen({ products, cart, setScreen, darkMode, setDarkMode, addToCart, clearAllData, openAdminModal }) {
  const displayedProducts = products.filter((p) => p.stock > 0);

  return (
    <ThemeContainer darkMode={darkMode}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, darkMode && styles.textLight]}>Flour & Bloom</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.smallMuted, darkMode && styles.textLight]}>Theme</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      <Text style={[styles.subtitle, darkMode && styles.textLight]}>
        Shop for your favorite bakery items.
      </Text>

      <FlatList
        data={displayedProducts}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <ProductCard item={item} onAddToCart={addToCart} darkMode={darkMode} />
        )}
        ListEmptyComponent={
          <Text style={[styles.smallMuted, darkMode && styles.textLight]}>No products available</Text>
        }
      />

      <TouchableOpacity onPress={() => setScreen("cart")} style={[styles.homeBtn, { marginTop: 10 }]}>
        <Text style={styles.homeBtnText}>Go to Cart ({cart.length})</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={openAdminModal} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Admin Mode</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={clearAllData} style={styles.deleteAllBtn}>
        <Text style={styles.deleteAllText}>Clear All Data</Text>
      </TouchableOpacity>
    </ThemeContainer>
  );
}

function ManageScreen({ products, setProducts, darkMode, setScreen }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("Bread");
  const [imageUri, setImageUri] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Permission required");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri ?? result.uri;
      setImageUri(uri);
    }
    setImageModalVisible(false);
  }

  function resetForm() {
    setName("");
    setPrice("");
    setStock("");
    setCategory("Bread");
    setImageUri("");
    setEditingId(null);
  }

  function validate() {
    if (!name.trim()) return Alert.alert("Validation", "Enter product name.");
    if (!price || isNaN(Number(price))) return Alert.alert("Validation", "Invalid price.");
    if (!stock || isNaN(Number(stock))) return Alert.alert("Validation", "Invalid stock.");
    return true;
  }

  function addOrUpdate() {
    if (!validate()) return;

    let updatedProducts;
    if (editingId) {
      updatedProducts = products.map((p) =>
        p.id === editingId ? { ...p, name: name.trim(), price: Number(price), stock: Number(stock), category, imageUri } : p
      );
    } else {
      const newProd = { id: Date.now().toString(), name: name.trim(), price: Number(price), stock: Number(stock), category, imageUri };
      updatedProducts = [newProd, ...products];
    }

    setProducts(updatedProducts);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    resetForm();
  }

  function startEdit(item) {
    setName(item.name);
    setPrice(String(item.price));
    setStock(String(item.stock));
    setCategory(item.category);
    setImageUri(item.imageUri || "");
    setEditingId(item.id);
  }

  function removeProduct(id) {
    Alert.alert("Confirm delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedProducts = products.filter((p) => p.id !== id);
          setProducts(updatedProducts);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
        },
      },
    ]);
  }

  return (
    <ThemeContainer darkMode={darkMode}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setScreen("home")}>
          <Text style={[styles.linkBack, darkMode && styles.textLight]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, darkMode && styles.textLight]}>Manage Products</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1, marginBottom: 120 }}>
        <View style={[styles.formCard, darkMode && styles.cardDark]}>
          <Text style={[styles.formTitle, darkMode && styles.textLight]}>
            {editingId ? "Edit Product" : "Add Product"}
          </Text>

          <TextInput placeholder="Name" value={name} onChangeText={setName} style={[styles.input, darkMode && styles.inputDark]} />
          <TextInput placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" style={[styles.input, darkMode && styles.inputDark]} />
          <TextInput placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" style={[styles.input, darkMode && styles.inputDark]} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.categoryChip, category === c && styles.categoryChipActive]}
                onPress={() => setCategory(c)}
              >
                <Text>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput placeholder="Image URL" value={imageUri} onChangeText={setImageUri} style={[styles.input, darkMode && styles.inputDark]} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={styles.pickImageBtn} onPress={() => setImageModalVisible(true)}>
              <Text style={styles.btnTextSmall}>Pick Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={addOrUpdate}>
              <Text style={styles.primaryBtnText}>{editingId ? "Update" : "Add Product"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={resetForm}>
              <Text>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={products.sort((a, b) => a.price - b.price)}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onEdit={startEdit}
              onDelete={removeProduct}
              darkMode={darkMode}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.smallMuted, darkMode && styles.textLight]}>No products</Text>
          }
        />

        <Modal visible={imageModalVisible} transparent animationType="slide">
          <View style={styles.modalWrap}>
            <View style={[styles.modalContent, darkMode && styles.cardDark]}>
              <Text style={[styles.modalTitle, darkMode && styles.textLight]}>Pick image</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={styles.primaryBtn} onPress={pickImage}>
                  <Text style={styles.primaryBtnText}>Choose photo</Text>
                </TouchableOpacity>
                <Pressable onPress={() => setImageModalVisible(false)} style={styles.ghostBtn}>
                  <Text>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ThemeContainer>
  );
}

// ----------------- Cart -----------------
function CartScreen({ cart, setCart, products, setProducts, darkMode, setScreen }) {
  const [customerName, setCustomerName] = useState("");
  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.productId) }));
  const cartTotal = items.reduce((s, it) => s + (it.product ? it.product.price * it.qty : 0), 0);

  function removeFromCart(productId) {
    const item = cart.find((c) => c.productId === productId);
    if (!item) return;
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + item.qty } : p)));
    const newCart = cart.filter((c) => c.productId !== productId);
    setCart(newCart);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(newCart));
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  function checkout() {
    if (!customerName.trim()) return Alert.alert("Enter customer name");
    if (cart.length === 0) return Alert.alert("Cart empty", "Add items first.");

    let receipt = `Customer: ${customerName}\n\nItems:\n`;
    items.forEach((it) => {
      if (it.product) receipt += `${it.product.name} x${it.qty} - ₱${formatNumber(it.product.price * it.qty)}\n`;
    });
    receipt += `\nTotal: ₱${formatNumber(cartTotal)}`;

    Alert.alert("Receipt", receipt);

    // Clear cart
    setCart([]);
    setCustomerName("");
    AsyncStorage.setItem(CART_KEY, JSON.stringify([]));
  }

  return (
    <ThemeContainer darkMode={darkMode}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setScreen("home")}>
          <Text style={[styles.linkBack, darkMode && styles.textLight]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, darkMode && styles.textLight]}>Cart</Text>
        <View style={{ width: 60 }} />
      </View>

      <TextInput
        placeholder="Customer Name"
        value={customerName}
        onChangeText={setCustomerName}
        style={[styles.input, darkMode && styles.inputDark]}
      />

      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        renderItem={({ item }) => (
          <View style={[styles.cartRow, darkMode && styles.cardDark]}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {item.product?.imageUri ? (
                <Image source={{ uri: item.product.imageUri }} style={styles.cartThumb} />
              ) : (
                <View style={[styles.cartThumb, styles.thumbnailPlaceholder]}>
                  <Text style={styles.thumbnailText}>No</Text>
                </View>
              )}
              <View>
                <Text style={[styles.cardTitle, darkMode && styles.textLight]}>{item.product?.name}</Text>
                <Text style={[styles.cardSubtitle, darkMode && styles.textLight]}>
                  ₱ {formatNumber(item.product?.price)} • Qty: {item.qty}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.productId)} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.smallMuted, darkMode && styles.textLight]}>Cart is empty</Text>}
      />

      <Text style={[styles.sectionTitle, darkMode && styles.textLight]}>Total: ₱ {formatNumber(cartTotal)}</Text>

     <View style={{ flexDirection: "row", gap: 10, marginTop: 0, marginBottom: 20, justifyContent: "center" }}>
  <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={checkout}>
    <Text style={styles.primaryBtnText}>Checkout</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.ghostBtn, { flex: 1 }]}
    onPress={() => {
      cart.forEach((c) => setProducts((prev) => prev.map((p) => (p.id === c.productId ? { ...p, stock: p.stock + c.qty } : p))));
      setCart([]);
    }}
  >
    <Text style={{ textAlign: "center" }}>Clear Cart</Text>
  </TouchableOpacity>
</View>

    </ThemeContainer>
  );
}

// ----------------- Main App -----------------
export default function App() {
  const [screen, setScreen] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");

  useEffect(() => {
    async function load() {
      const rawProducts = await AsyncStorage.getItem(STORAGE_KEY);
      const rawCart = await AsyncStorage.getItem(CART_KEY);
      const rawTheme = await AsyncStorage.getItem(THEME_KEY);
      if (rawProducts) setProducts(JSON.parse(rawProducts));
      if (rawCart) setCart(JSON.parse(rawCart));
      if (rawTheme) setDarkMode(JSON.parse(rawTheme));
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }, [products]);
  useEffect(() => { AsyncStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { AsyncStorage.setItem(THEME_KEY, JSON.stringify(darkMode)); }, [darkMode]);

  function addToCart(productId, qty = 1) {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return Alert.alert("Error", "Product not found");
    if (prod.stock < qty) return Alert.alert("Out of stock", "Not enough stock.");

    const existing = cart.find((c) => c.productId === productId);
    const newCart = existing
      ? cart.map((c) => (c.productId === productId ? { ...c, qty: c.qty + qty } : c))
      : [{ productId, qty }, ...cart];

    setCart(newCart);
    setProducts(products.map((p) => (p.id === productId ? { ...p, stock: p.stock - qty } : p)));
  }

  function clearAllData() {
    Alert.alert("Clear all?", "This will remove all data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          setProducts([]);
          setCart([]);
          setScreen("home");
        },
      },
    ]);
  }

  function openAdminModal() {
    setAdminModalVisible(true);
    setAdminPasswordInput("");
  }

  function checkAdminPassword() {
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setAdminModalVisible(false);
      setScreen("manage");
    } else Alert.alert("Wrong password");
  }

  if (loading) return <View style={styles.loading}><Text>Loading...</Text></View>;

  return (
    <View style={{ flex: 1 }}>
      {screen === "home" && (
        <HomeScreen
          products={products}
          cart={cart}
          setScreen={setScreen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          addToCart={addToCart}
          clearAllData={clearAllData}
          openAdminModal={openAdminModal}
        />
      )}
      {screen === "manage" && <ManageScreen products={products} setProducts={setProducts} darkMode={darkMode} setScreen={setScreen} />}
      {screen === "cart" && <CartScreen cart={cart} setCart={setCart} products={products} setProducts={setProducts} darkMode={darkMode} setScreen={setScreen} />}

      {/* Admin password modal */}
      <Modal visible={adminModalVisible} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={[styles.modalContent, darkMode && styles.cardDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textLight]}>Admin Login</Text>
            <TextInput
              placeholder="Password"
              value={adminPasswordInput}
              onChangeText={setAdminPasswordInput}
              secureTextEntry
              style={[styles.input, darkMode && styles.inputDark]}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={styles.primaryBtn} onPress={checkAdminPassword}>
                <Text style={styles.primaryBtnText}>Login</Text>
              </TouchableOpacity>
              <Pressable style={styles.ghostBtn} onPress={() => setAdminModalVisible(false)}>
                <Text>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ----------------- Styles -----------------
const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayLight: { backgroundColor: "rgba(255,255,255,0.2)" },
  overlayDark: { backgroundColor: "rgba(0,0,0,0.5)" },
  safeArea: { flex: 1, padding: 12, paddingTop: Platform.OS === "android" ? 36 : 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginBottom: 8 },
  textLight: { color: "#fff" },
  smallMuted: { color: "#555", fontSize: 12 },
  card: { backgroundColor: "#fff", padding: 12, marginVertical: 6, borderRadius: 10 },
  cardDark: { backgroundColor: "#333" },
  cardTitle: { fontWeight: "bold" },
  cardSubtitle: { color: "#555" },
  cardSubtitleSmall: { fontSize: 12, color: "#888" },
  cardActions: { flexDirection: "row", gap: 6, marginTop: 8 },
  smallBtn: { padding: 6, backgroundColor: "#eee", borderRadius: 6 },
  deleteSmallBtn: { backgroundColor: "#ff5555" },
  cartSmallBtn: { backgroundColor: "#55aa55" },
  smallBtnText: { fontSize: 12 },
  thumbnail: { width: 60, height: 60, borderRadius: 8 },
  thumbnailPlaceholder: { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" },
  thumbnailText: { fontSize: 10, color: "#555" },
  homeBtn: { backgroundColor: "#555", padding: 10, borderRadius: 10, marginVertical: 6 },
  homeBtnText: { color: "#fff", fontWeight: "bold" },
  primaryBtn: { backgroundColor: "#007bff", padding: 10, borderRadius: 10, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "bold" },
  ghostBtn: { borderWidth: 1, borderColor: "#888", padding: 10, borderRadius: 10, alignItems: "center" },
  deleteAllBtn: { marginTop: 12, padding: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#f55" },
  deleteAllText: { color: "#fff", fontWeight: "bold" },
  input: { backgroundColor: "#fff", borderRadius: 8, padding: 8, marginVertical: 4 },
  inputDark: { backgroundColor: "#555", color: "#fff" },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 12, minWidth: 300 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  linkBack: { fontSize: 16, color: "#007bff" },
  formCard: { padding: 12, marginVertical: 6, borderRadius: 10, backgroundColor: "#fff" },
  formTitle: { fontWeight: "bold", marginBottom: 8 },
  categoryChip: { padding: 6, borderRadius: 6, borderWidth: 1, borderColor: "#888", marginRight: 6 },
  categoryChipActive: { backgroundColor: "#007bff", color: "#fff" },
  pickImageBtn: { padding: 8, backgroundColor: "#888", borderRadius: 8 },
  btnTextSmall: { color: "#fff" },
  cartRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, marginVertical: 4, borderRadius: 10, backgroundColor: "#fff" },
  cartThumb: { width: 50, height: 50, borderRadius: 8 },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginTop: 12 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
