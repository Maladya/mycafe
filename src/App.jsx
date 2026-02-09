import "./App.css";

function App() {
  return (
    <>
      <div className="flex h-screen">
        <div className="w-1/2 p-4 ms-40">
          <h1 className="font-black mt-20 text-3xl ">LOGIN</h1>
          <h1 className="text-sm ">Silahkan masuk untuk melanjutkan</h1>
          <h1 className="mt-5 pt-5">Email</h1>
          <input
            type="text"
            className="input"
            placeholder="example@gmail.com"
          />
          <h1 className="mt-5 pt-5">Password</h1>
          <input
            type="text"
            className="input mb-9"
            placeholder="Masukan Password"
          />

          <button
            className="bg-blue-900 text-white w-75 btn ms-2"
            onClick={() => (window.location.href = "/admin/dashboard")}
          >
            Manuk
          </button>
          <h3 className="text-xs ms-19">
            Belum punya akun?{" "}
            <a href="/daftar" className="text-xs text-blue-900">
              Daftar
            </a>
          </h3>
        </div>
        <div className="w-1/2 sm:hidden md:block bg-blue-900 text-white p-4 items-center justify-content-center">
          <h1 className="text-center font-bold text-5xl">MyCafe</h1>
        </div>
      </div>
    </>
  );
}

export default App;
