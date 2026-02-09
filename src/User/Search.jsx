import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";

const items = [
  { id: 1, name: "Americano", price: "Rp.10.000", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93" },
  { id: 2, name: "Espresso", price: "Rp.10.000", img: "https://images.unsplash.com/photo-1511920170033-f8396924c348" },
  { id: 3, name: "Cappuccino", price: "Rp.10.000", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93" },
  { id: 4, name: "Latte Machiato", price: "Rp.10.000", img: "https://images.unsplash.com/photo-1521302080334-4bebac2763a6" },
  { id: 5, name: "Cafe Latte", price: "Rp.10.000", img: "https://images.unsplash.com/photo-1511920170033-f8396924c348" },
];

export default function MenuPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen border">

      {/* SEARCH HEADER */}
      <div className="border-b shadow-sm">

       

        <div className="flex items-center gap-3 px-4 py-3">

          <ArrowLeft size={22} className="text-black cursor-pointer"onClick={() => window.location = "/"}/>

          <div className="flex items-center flex-1 gap-2 px-4 py-2 border border-gray-400 rounded-full">

            <Search size={18} className="text-gray-400" />

            <input
              type="text"
              placeholder="Lagi pengen apa hari ini ?"
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">

        <h2 className="font-bold text-lg mb-3">
          Wajib Coba Minggu Ini
        </h2>

        <div className="space-y-3">
          {items
            .filter(i =>
              i.name.toLowerCase().includes(search.toLowerCase())
            )
            .map(item => (
              <div
                key={item.id}
                className="flex gap-3 rounded-2xl p-3 shadow-sm border hover:shadow-md transition"
              >
                <img
                  src={item.img}
                  className="w-20 h-20 object-cover rounded-xl"
                />

                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    Sensasi rasa ingin memiliki bercampur dengan rasanya yang tak pernah ada.
                  </p>
                  <p className="font-bold mt-1">{item.price}</p>
                </div>

                <button className="border border-blue-500 text-blue-600 rounded-lg px-3 py-1 h-fit self-end text-sm hover:bg-blue-50 transition">
                  Tambah
                </button>
              </div>
            ))}
        </div>

      </div>
    </div>
  );
}
