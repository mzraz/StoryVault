import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import Navbar from "../navbar";
import { IoBookSharp } from "react-icons/io5";
import { MdDeleteForever } from "react-icons/md";
import PopupAlert from "../../components/PopupAlert";
import { FaBookOpen } from "react-icons/fa";

const UserBooks = () => {
  const { state } = useLocation();
  const [books, setBooks] = useState([]);
  const [show, setShow] = useState(false);
  const [showPopUp, setPopup] = useState(false);
  const [bookId, setBookId] = useState();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    axios({
      method: "get",
      url: `${process.env.REACT_APP_API_BASE_URL}/api/book/getBookByUserId/${state.awsUserId}`,
    })
      .then((res) => {
        console.log("res.data.data.data----", res.data.data.data);
        setBooks(res.data.data.data);
        setShow(true);
      })
      .catch((err) => {
        setShow(true);
        console.log(err);
      });
  }, []);

  const deleteBook = (value, id) => {
    console.log(id);
    setPopup(value);
    setBookId(id);
  };

  const confirmDeleteBook = () => {
    axios({
      method: "delete",
      url: `${process.env.REACT_APP_API_BASE_URL}/api/admin/deleteBook`,
      data: { bookId },
    })
      .then((res) => {
        setBooks((prev) => prev.filter((user) => user.bookId != bookId));
        console.log("delete sucess----");
        setPopup(false);
      })
      .catch((err) => {
        console.log("err while delete user---", err);
      });
  };

  const bookHovering = (id, isHovered) => {
    const button = document.getElementById(`${id}book`);
    if (button) {
      button.style.display = isHovered ? "block" : "none";
    }
  };

  const previewBook = (bookId) => {
    axios({
      method: "post",
      url: `${process.env.REACT_APP_API_BASE_URL}/api/admin/previewBook`,
      data: { bookId },
    })
      .then((res) => {
        console.log(res);

        const s3Link = res?.data?.pdfStoryUrl;

        fetch(s3Link, {
          method: "HEAD",
        })
          .then((response) => {
            if (response.ok) {
              window.open(res?.data?.pdfStoryUrl, res?.data?.pdfStoryUrl);
            } else {
              console.log("PDF file does not exist at the given S3 link.");
            }
          })
          .catch((error) => {
            console.error("Error checking the S3 link:", error);
          });
      })
      .catch((err) => {
        console.log("err while delete user---", err);
      });
  };

  return (
    <>
      <div className="ml-64 ">
        <Navbar name={"Users Books"} url={"/users"} />
      </div>

      <>
        {books.length > 0 ? (
          <div className="ml-64  mt-6 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 bookBorder">
            {books
              ?.map((book) => (
                <div
                  key={book?.bookId}
                  className="group pb-4 px-2 pt-2 bookBorder relative"
                >
                  <div className="w-full  h-96 rounded-lg overflow-hidden">
                    <div className="containersm -mt-4">
                      <div className="booksm">
                        <div className="frontsm">
                          <div
                            className="coversm "
                            onMouseEnter={() =>
                              bookHovering(book?.bookId, true)
                            }
                            onMouseDown={() => bookHovering(book?.bookId, true)}
                            onMouseLeave={() =>
                              bookHovering(book?.bookId, false)
                            }
                            style={{ backgroundColor: book.book_color }}
                          >
                            {book?.frontCover ? (
                              <img
                                style={{ width: "255px", height: "370px" }}
                                src={book?.frontCover}
                                alt={book.title}
                                className=""
                              />
                            ) : (
                              <img
                                style={{ width: "255px", height: "370px" }}
                                src={`https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/${process.env.REACT_APP_S3_BUCKET}/bookcovers/${book.title}front${state.awsUserId}.png`}
                                alt={book.title}
                                className=""
                              />
                            )}
                          </div>
                        </div>
                        <div
                          className="left-sidesm"
                          style={{
                            backgroundColor:
                              book.cover_template_id === 0
                                ? "#fff"
                                : book.book_color,
                          }}
                        >
                          <h2 style={{ alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: "12px",
                                color: book.spine_color
                                  ? book.spine_color
                                  : "black",
                              }}
                              className="font-semibold"
                            >
                              {"" /*book.title*/}
                            </span>
                          </h2>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-16 pb-2"
                    style={{
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div className="top-2 right-2 z-50">
                        <button
                          style={{
                            marginLeft: "10px",
                          }}
                          onClick={() => previewBook(book?.bookId)}
                        >
                          <FaBookOpen fill={"#689290"} size={25} />
                        </button>
                        <button
                          className=" top-0 right-0 m-2 bg-transparent"
                          onClick={() => deleteBook(true, book?.bookId)}
                        >
                          <MdDeleteForever fill={"#689290"} size={25} />
                        </button>
                      </div>
                      <h3 className=" text-base font-semibold text-gray-900">
                        <a>{book.title}</a>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Author: {book.author}
                      </p>
                    </div>
                  </div>

                  {book.bookType === 2 ? (
                    <>
                      {book.coAuthors ? (
                        <div className="flex justify-center">
                          <a
                            data-tooltip-id="book-tooltip"
                            data-tooltip-html={`<div><ul>${
                              book.coAuthors
                                ? Array.from(new Set(book.coAuthors))
                                    .map((d) => `<li>&#8226; ${d}</li>`)
                                    .join("")
                                : "No Co-Author"
                            }</ul></div>`}
                            data-tooltip-offset={0}
                            data-tooltip-float={true}
                            data-tooltip-delay-show={300}
                            data-tooltip-variant="warning"
                          >
                            <div className="flex items-center border border-teal-600 bg-teal-500 rounded-md h-10 w-72">
                              <p className="px-1.5 text-xs text-white truncate w-72">
                                Co-Author:{" "}
                                {book.coAuthors
                                  ? book.coAuthors.map(
                                      (d, i) =>
                                        `${d}${
                                          i < book.coAuthors.length - 1
                                            ? ", "
                                            : ""
                                        }`
                                    )
                                  : ""}
                              </p>
                            </div>
                          </a>
                          <Tooltip id="book-tooltip" />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ))
              .reverse()}
          </div>
        ) : (
          show && (
            <div
              className="text-xl font-semibold flex justify-center items-center mt-20 ml-64"
              style={{
                fontSize: "30px",
                opacity: "0.5",
                display: "flex",
                alignItems: "stretch",
              }}
            >
              <IoBookSharp size={32} fill="#33606a" /> <span>No Books</span>
            </div>
          )
        )}
      </>

      {showPopUp ? (
        <div
          id="popup-modal"
          tabindex="-1"
          className="fixed top-0 left-0 right-0 z-50 p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full"
        >
          <div
            className="fixed inset-0 w-full h-full bg-black opacity-40"
            onClick={() => setDeletePopup(false)}
          ></div>
          <div className="relative w-full max-w-md max-h-full mx-auto">
            <div className="relative bg-white rounded-lg shadow">
              <button
                onClick={() => deleteBook(false)}
                type="button"
                className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
                data-modal-hide="popup-modal"
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
              <div className="p-6 text-center">
                <svg
                  className="mx-auto mb-4 text-gray-400 w-12 h-12"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <h3 className="mb-5 text-lg font-normal text-gray-500">
                  Are you sure you want to delete this Book?
                </h3>
                <button
                  data-modal-hide="popup-modal"
                  type="button"
                  className="text-white bg-teal-500 hover:bg-teal-600 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center mr-2"
                  onClick={() => confirmDeleteBook()}
                >
                  Yes, I'm sure
                </button>
                <button
                  onClick={() => deleteBook(false)}
                  data-modal-hide="popup-modal"
                  type="button"
                  className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default UserBooks;
