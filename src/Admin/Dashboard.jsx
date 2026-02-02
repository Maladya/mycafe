export default function Dashboard() {
  return (  
    <div className="dashboard h-scree">
      <div className="flex min-h-screen">
        <div className="w-1/4 flex min-h-screen flex-col items-center h-full">
          <h1 className="text-center text-sm mt-15 mb-2 ">Admin Panel</h1>
          <div className="border-1 border-gray-400 b mt-1 rounded-sm h-15">
            <div className="flex p-2 w-full items-center ">
              <img
                className="w-9 rounded-4xl "
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDMgKRG2DbqpXvwrc1CHCqHWoG2P1IoUysPA&s"
                alt=""
              />
              <div className="flex flex-col ms-2">
                <h1 className="">Admin</h1>
                <h1 className="">mahesa@gmail.com</h1>
              </div>
            </div>
            <div className="flex p-2 w-full items-center ">
              <img
                className="w-5 ms-7 mt-3 "
                src="https://img.icons8.com/?size=100&id=83326&format=png&color=000000"
                alt=""
              />
              <div className="flex ms-1 mt-3">
                <h1 className="">Dasboard</h1>
              </div>
            </div>
            <div className="flex p-2 w-full items-center ">
              <img
                className="w-5 ms-7 mt-3 "
                src="https://img.icons8.com/?size=100&id=3096&format=png&color=000000"
                alt=""
              />
              <div className="flex ms-1 mt-3">
                <h1 className="">Menu</h1>
              </div>
            </div>
            <div className="flex p-2 w-full items-center ">
              <img
                className="w-5 ms-7 mt-3 "
                src="https://img.icons8.com/?size=100&id=24686&format=png&color=000000"
                alt=""
              />
              <div className="flex ms-1 mt-3">
                <h1 className="">Table</h1>
              </div>
            </div>
            <div className="flex p-2 w-full items-center ">
              <img
                className="w-5 ms-7 mt-3 "
                src="https://img.icons8.com/?size=100&id=12089&format=png&color=000000"
                alt=""
              />
              <div className="flex ms-1 mt-3">
                <h1 className="">Promo</h1>
              </div>
            </div>
            <div className="flex p-2 w-full items-center ">
              <img
                className="w-5 ms-7 mt-3 "
                src="https://img.icons8.com/?size=100&id=77124&format=png&color=000000"
                alt=""
              />
              <div className="flex ms-1 mt-3">
                <h1 className="">Payment</h1>
              </div>
            </div>
            <div className="flex p-2 w-full items-center ">
              <img
                className="w-5 ms-7 mt-3 "
                src="https://img.icons8.com/?size=100&id=4257&format=png&color=000000"
                alt=""
              />
              <div className="flex ms-1 mt-3">
                <h1 className="">Billing</h1>
              </div>
            </div>
            <div className="flex p-2 w-full items-center ">
              <img
                className="w-5 ms-7 mt-3 "
                src="https://img.icons8.com/?size=100&id=364&format=png&color=000000"
                alt=""
              />
              <div className="flex ms-1 mt-3">
                <h1 className="">Setting</h1>
              </div>
            </div>
            <div className="flex ms-11 p-2 w-30 h-10 items-center border mt-8 rounded-2xl">
              <img
                className="w-5  ms-4 "
                src="https://img.icons8.com/?size=100&id=2445&format=png&color=000000"
                alt=""
              />
              <div className="flex ms-1 ">
                <h1 className="">Keluar</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/1 sm:hidden md:block bg-gray-200 items-center justify-content-center">
          <div className=" w-full h-10 bg-white"></div>
          <div>
            <h1 className="ms-12 mt-1 text-sm">Admin/Beranda</h1>
            <h3 className="ms-11 mt-1 text-3xl">Dashboard</h3>
          </div>
          <div className="flex row-auto">
            <div className="card bg-primary text-primary-content w-60 ms-20 mt-10">
              <div className="card-body">
                <h1 className="card-title text-sm">Jumlah Menu</h1>
                <p>
                  <spam className="text-2xl font-bold">10</spam>
                </p>
              </div>
            </div>
            <div className="card bg-primary text-primary-content w-60 ms-20 mt-10">
              <div className="card-body">
                <h1 className="card-title text-sm">Jumlah Menu</h1>
                <p>
                  <spam className="text-2xl font-bold">10</spam>
                </p>
              </div>
            </div>
            <calendar-date className="cally bg-base-100 border border-base-300 shadow-lg rounded-box">
              <svg
                aria-label="Previous"
                className="fill-current size-4"
                slot="previous"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                ></path>
              </svg>
              <svg
                aria-label="Next"
                className="fill-current size-4"
                slot="next"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5"></path>
              </svg>
              <calendar-month></calendar-month>
            </calendar-date>
          </div>
          <div className="flex row-auto">
            <div className="card bg-primary text-primary-content w-60 ms-20 mt-10">
              <div className="card-body">
                <h1 className="card-title text-sm">Jumlah Menu</h1>
                <p>
                  <spam className="text-2xl font-bold">10</spam>
                </p>
              </div>
            </div>
            <div className="card bg-primary text-primary-content w-60 ms-20 mt-10">
              <div className="card-body">
                <h1 className="card-title text-sm">Jumlah Menu</h1>
                <p>
                  <spam className="text-2xl font-bold">10</spam>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
