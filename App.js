// App.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  Switch,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { GlobalContext } from "./GlobalContext";
import * as ImagePicker from "expo-image-picker";

const BACKGROUND =
  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1470&q=80";
const ADMIN_PASSWORD = "admin123";
const CATEGORIES = ["Bread", "Cake", "Pastry", "Drinks", "Other"];

// ----------------- Theme Container -----------------
const ThemeContainer = ({ children, darkMode }) => (
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
function HomeScreen({ setScreen }) {
  const { products, cart, darkMode, setDarkMode, setAdminModalVisible, setProducts } =
    useContext(GlobalContext);

  const displayedProducts = products.filter((p) => p.stock > 0);

  function clearAllData() {
    Alert.alert("Clear all?", "This will remove all data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          setProducts([]);
        },
      },
    ]);
  }

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
        renderItem={({ item }) => <ProductCard item={item} onAddToCart={() => {}} darkMode={darkMode} />}
        ListEmptyComponent={
          <Text style={[styles.smallMuted, darkMode && styles.textLight]}>No products available</Text>
        }
      />

      <TouchableOpacity onPress={() => setScreen("cart")} style={[styles.homeBtn, { marginTop: 10 }]}>
        <Text style={styles.homeBtnText}>Go to Cart ({cart.length})</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setAdminModalVisible(true)} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Admin Mode</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={clearAllData} style={styles.deleteAllBtn}>
        <Text style={styles.deleteAllText}>Clear All Data</Text>
      </TouchableOpacity>
    </ThemeContainer>
  );
}

// ----------------- Main App -----------------
export default function App() {
  const { loading, adminModalVisible, setAdminModalVisible, adminPasswordInput, setAdminPasswordInput } =
    useContext(GlobalContext);
  const [screen, setScreen] = useState("home");

  function checkAdminPassword() {
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setAdminModalVisible(false);
      setScreen("manage");
    } else Alert.alert("Wrong password");
  }

  if (loading) return <View style={styles.loading}><Text>Loading...</Text></View>;

  return (
    <View style={{ flex: 1 }}>
      {screen === "home" && <HomeScreen setScreen={setScreen} />}
      {/* TODO: Add ManageScreen & CartScreen using Context similarly */}

      {/* Admin password modal */}
      <Modal visible={adminModalVisible} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={[styles.modalContent]}>
            <Text style={styles.modalTitle}>Admin Login</Text>
            <TextInput
              placeholder="Password"
              value={adminPasswordInput}
              onChangeText={setAdminPasswordInput}
              secureTextEntry
              style={styles.input}
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
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 12, minWidth: 300 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
