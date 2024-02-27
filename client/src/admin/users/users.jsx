import React, { useEffect, useState } from "react";
import Navbar from "../navbar";
import axios from "axios";
import moment from "moment";
import { useNavigate, useLocation } from "react-router-dom";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios({
      method: "get",
      url: `${process.env.REACT_APP_API_BASE_URL}/api/admin/getAllUsers`,
    })
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        console.log(err.response.data.message);
      });
  }, []);

  const handleDelete = (awsUserId) => {
    axios({
      method: "post",
      url: `${process.env.REACT_APP_API_BASE_URL}/api/deleteUser`,
      data: { awsUserId },
    })
      .then((res) => {
        setUsers((prev) => prev.filter((user) => user.awsUserId != awsUserId));
        console.log("delete sucess----");
        // logout();
      })
      .catch((err) => {
        console.log("err while delete user---", err);
      });
  };

  const handleUserBooks = (awsUserId) => {
    navigate("/userbooks", { state: { awsUserId } });
  };

  return (
    <div className="ml-64 h-screen">
      <Navbar name={"Users"} />

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full px-10 text-sm text-left rtl:text-right text-gray-500 ">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50  ">
            <tr>
              <th scope="col" className="px-6 py-3">
                Username
              </th>
              <th scope="col" className="px-6 py-3">
                Email
              </th>

              <th scope="col" className="px-6 py-3">
                Last Login
              </th>

              <th scope="col" className="px-6 py-3">
                Signup Date
              </th>

              <th scope="col" className="px-6 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {users
              .map((user, i) => (
                <tr
                  key={i}
                  className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td
                    className="px-6 py-4"
                    onClick={() => handleUserBooks(user.awsUserId)}
                  >
                    {user?.username}
                  </td>
                  <td
                    className="px-6 py-4"
                    onClick={() => handleUserBooks(user.awsUserId)}
                  >
                    {user?.email}
                  </td>

                  <td
                    className="px-6 py-4"
                    onClick={() => handleUserBooks(user.awsUserId)}
                  >
                    {moment(user?.login_date).format("MMM Do YY")}
                  </td>

                  <td
                    className="px-6 py-4"
                    onClick={() => handleUserBooks(user.awsUserId)}
                  >
                    {moment(user?.createdAt).format("MMM Do YY")}
                  </td>
                  <td className="px-6 py-4 ">
                    <button
                      onClick={() => handleDelete(user?.awsUserId)}
                      className="cursor-pointer font-medium text-[#33606a] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
              .reverse()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
