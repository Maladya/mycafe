import { useState } from "react";
import { Search, Menu, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("promo");
  const [selectedDropdown, setSelectedDropdown] = useState("Pilihan...");
  const [openCategory, setOpenCategory] = useState(false);
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const menuItems = [
    {
      id: 1,
      name: "Kopi",
      price: "Rp11.000",
      image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed",
    },
    {
      id: 2,
      name: "Kopi",
      price: "Rp11.000",
      image: "https://images.unsplash.com/photo-1763473821509-9a383b480844",
    },
    {
      id: 3,
      name: "Kopi",
      price: "Rp11.000",
      image: "https://images.unsplash.com/photo-1506188044630-210826194885",
    },
  ];
  const otherItems = [
    {
      id: 4,
      name: "Special Dessert",
      price: "Rp15.000",
      image:
        "https://images.unsplash.com/photo-1766734974600-b6ea9a40a03a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxmb29kJTIwZGlzaCUyMGRlc3NlcnQlMjByZXN0YXVyYW50JTIwbWVudXxlbnwwfHx8fDE3NzAxNzU0Mjl8MA&ixlib=rb-4.1.0&q=85",
    },
    {
      id: 5,
      name: "Chocolate Cake",
      price: "Rp18.000",
      image:
        "https://images.unsplash.com/photo-1766735007331-e720ca937c83?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwzfHxmb29kJTIwZGlzaCUyMGRlc3NlcnQlMjByZXN0YXVyYW50JTIwbWVudXxlbnwwfHx8fDE3NzAxNzU0Mjl8MA&ixlib=rb-4.1.0&q=85",
    },
  ];
  const [cart, setCart] = useState({});

  const addItem = (id) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeItem = (id) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[id] > 1) updated[id]--;
      else delete updated[id];
      return updated;
    });
  };

  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);

  const totalPrice = menuItems.reduce(
    (sum, item) => sum + (cart[item.id] || 0) * item.price,
    0,
  );

  return (
    <div className="w-sm mx-auto min-h-screen bg-white border">
      {/* Header */}
      
          
          <div className="relative">

  {/* HERO IMAGE */}
  <img
    src="https://images.unsplash.com/photo-1765894711260-9d881459ddb4"
    className="w-full h-[160px] object-cover"
  />

  {/* DARK OVERLAY (atur opacity disini) */}
  <div className="absolute inset-0 bg-black/40"></div>

  {/* CONTENT DI ATAS GAMBAR */}
  <div className="absolute top-4 right-4 flex gap-4 z-10">

    <button
      onClick={() => (window.location = "/search")}
      className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur border rounded-full hover:scale-105 transition"
    >
      <Search size={16} />
    </button>

    <button
      onClick={() => (window.location = "/dropdown")}
      className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur border rounded-full hover:scale-105 transition"
    >
      <Menu size={16} />
    </button>

  </div>
</div>


      <div className="p-6">
        {/* Location */}
        <div
          className="border-2 rounded-2xl p-4 flex justify-between items-center mb-4 cursor-pointer"
          onClick={() => (window.location = "/outlet")}
        >
          <div>
            <p className="font-bold">ASTAKIRA - CIAKAR</p>
            <p className="text-sm text-gray-600">08:00 - 17:00</p>
          </div>
          <ChevronRight />
        </div>
        {/* Table */}
        <button className="w-full h-10 bg-blue-600 text-white rounded-xl py-2 mb-6">
          Nomor Meja: 1
        </button>
        {/* Tabs */}
        {/* Tab Navigation */}
        <div
          className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          data-testid="tab-navigation"
        >
          <button
            onClick={() => setOpenCategory(true)}
            className="cursor-pointer flex items-center gap-2 border rounded-lg px-4 py-2"
          >
            {selectedDropdown}
            <ChevronDown size={18} />
          </button>

          <button
            className={` border rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === "promo"
                ? "bg-gray-900 text-white border-gray-900 font-semibold"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-600 hover:text-blue-600"
            }`}
            onClick={() => {
              setActiveTab("promo");
              scrollToSection("promo");
            }}
            data-testid="tab-promo"
          >
            Promo
          </button>
          <button
            className={` border rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === "recommendation"
                ? "bg-gray-900 text-white border-gray-900 font-semibold"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-600 hover:text-blue-600"
            }`}
            onClick={() => {
              setActiveTab("recommendation");
              scrollToSection("recommendation");
            }}
            data-testid="tab-recommendation"
          >
            Menu Recommendation
          </button>

          <button
            className={`border rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === "coffee"
                ? "bg-gray-900 text-white border-gray-900 font-semibold"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-600 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("coffee")}
            data-testid="tab-coffee"
          >
            Coffee
          </button>
          <button
            className={`border rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === "coffee"
                ? "bg-gray-900 text-white border-gray-900 font-semibold"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-600 hover:text-blue-600"
            }`}
            onClick={() => {
              setActiveTab("coffee");
            }}
            data-testid="tab-coffee"
          >
            Coffee
          </button>
          <button
            className={`border rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === "coffee"
                ? "bg-gray-900 text-white border-gray-900 font-semibold"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-600 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("recommendation")}
            data-testid="tab-coffee"
          >
            Coffee
          </button>
        </div>
        <section id="promo">
          <div className="mb-8" data-testid="other-items-section" >
          <h3
          
            className="text-lg font-bold text-gray-900 mb-4 tracking-wide"
            data-testid="section-title-other"
          >
            Promo
          </h3>
          <div
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            data-testid="other-items-grid"
          >
            {otherItems.map((item) => {
              const qty = cart[item.id] || 0;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl flex min-w-[280px] overflow-hidden hover:-translate-x-1 hover:shadow-xl hover:border-blue-600 transition-all duration-300"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-[120px] h-full object-cover flex-shrink-0"
                  />

                  <div className="p-4 flex flex-col justify-center flex-1">
                    <h4 className="font-semibold mb-2">{item.name}</h4>
                    <p className="font-bold mb-2">{item.price}</p>

                    {qty === 0 ? (
                      <button
                      onClick={() => addItem(item.id)}
                      className="w-full border border-blue-500 text-blue-600 rounded-lg py-1 hover:bg-blue-50 transition"
                    >
                      Tambah
                    </button>
                  ) : (
                    <div className="flex items-center justify-between border rounded-lg px-3 py-1">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xl font-bold"
                      >
                        −
                      </button>

                      <span className="font-semibold">{qty}</span>

                      <button
                        onClick={() => addItem(item.id)}
                        className="text-xl font-bold"
                      >
                        +
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </section>
          
        
        {/* Menu */}
        <div
          className="mb-8"
          data-testid="other-items-section"
          id="recommendation"
        >
          <h3
            className="text-lg font-bold text-gray-900 mb-4 tracking-wide"
            data-testid="section-title-other"
          >
            Menu Recommendation
          </h3>

          {/* MENU GRID */}
          <div className="grid grid-cols-2 gap-4 p-4">
            {menuItems.map((item) => {
              const qty = cart[item.id] || 0;

              return (
                <div
                  key={item.id}
                  className="border rounded-xl p-3 text-center
                   transition-all duration-300
                   hover:shadow-lg hover:-translate-y-1
                   hover:border-blue-400 group"
                >
                  <img
                    src={item.image}
                    className="h-28 w-full object-cover rounded-xl mb-2"
                  />

                  <p className="font-semibold">{item.name}</p>
                  <p className="font-bold mb-2">
                    Rp{item.price.toLocaleString()}
                  </p>

                  {qty === 0 ? (
                    <button
                      onClick={() => addItem(item.id)}
                      className="w-full border border-blue-500 text-blue-600 rounded-lg py-1 hover:bg-blue-50 transition"
                    >
                      Tambah
                    </button>
                  ) : (
                    <div className="flex items-center justify-between border rounded-lg px-3 py-1">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xl font-bold"
                      >
                        −
                      </button>

                      <span className="font-semibold">{qty}</span>

                      <button
                        onClick={() => addItem(item.id)}
                        className="text-xl font-bold"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHECKOUT BAR */}
      {totalQty > 0 && (
        <div className=" fixed mx-auto w-sm bottom-0 bg-blue-600 text-white p-4 flex items-center gap-4 shadow-lg">
          <div className="flex-1">
            <p className="text-sm">Total</p>
            <p className="font-bold text-lg ">
              Rp{totalPrice.toLocaleString()}
            </p>
          </div>

          <button
  onClick={() =>
    navigate("/pesanan", {
      state: {
        cart: cart,
        items: menuItems,
      },
    })
  }
  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold"
>
  CHECK OUT ({totalQty})
</button>

        </div>
      )}
      {/* ===== BOTTOM SHEET KATEGORI ===== */}
      {openCategory && (
        <div className="mx-auto fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="mx-auto bg-white w-100 rounded-t-3xl p-6 animate-slideUp">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">Item Kategori</h2>
              <button onClick={() => setOpenCategory(false)}>✕</button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedDropdown("Pilihan Terbaik");
                  setOpenCategory(false);
                }}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold"
              >
                Pilihan Terbaik
              </button>

              <button
                onClick={() => {
                  setSelectedDropdown("Minuman");
                  setOpenCategory(false);
                }}
                className="w-full border border-blue-300 text-blue-500 py-4 rounded-xl font-semibold"
              >
                MINUMAN
              </button>

              <button
                onClick={() => {
                  setSelectedDropdown("Makanan");
                  setOpenCategory(false);
                }}
                className="w-full border border-blue-300 text-blue-500 py-4 rounded-xl font-semibold"
              >
                MAKANAN
              </button>

              <button
                onClick={() => {
                  setSelectedDropdown("Snack");
                  setOpenCategory(false);
                }}
                className="w-full border border-blue-300 text-blue-500 py-4 rounded-xl font-semibold"
              >
                SNACK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
