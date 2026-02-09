export default function Daftar() {
  return (
    <div>
      <div className="flex  h-screen">
        <div className="w-1/2 p-4 ms-40">
          <h1 className="font-black mt-10 text-3xl ms-25">DAFTAR</h1>
          <h1 className="mt-15 pt-5">Email</h1>
          <input
            type="text"
            className="input"
            placeholder="example@gmail.com"
          />
          <h1 className="mt-3">Username</h1>
          <input type="text" className="input" placeholder="Masukan Password" />
          <h1 className="mt-3">Password</h1>
          <input type="text" className="input" placeholder="Masukan Password" />
          <h1 className="mt-3">No HP</h1>
          <div className="flex items-center border rounded input mb-9 focus-within:ring-2 focus-within:ring-blue-900">
            <span className="px-3 text-gray-500">+62</span>
            <input
              type="tel"
              className="w-full outline-none py-2"
              placeholder="812xxxxxxx"
            />
          </div>

          <button
            className="bg-blue-900 text-white w-75 btn ms-2"
            onClick={() => (window.location.href = "/")}
          >
            Daftar
          </button>
          <h3 className="text-xs ms-19">
            Sudah punya akun?{" "}
            <a href="/" className="text-xs text-blue-900">
              Masuk
            </a>
          </h3>
        </div>
        <div className="w-1/2 sm:hidden md:block bg-blue-900 text-white p-4 items-center justify-content-center">
          <h1 className="text-center font-bold text-5xl">MyCafe</h1>
        </div>
      </div>
    </div>
  );
}
