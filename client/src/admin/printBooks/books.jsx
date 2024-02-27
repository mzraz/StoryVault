import React, { useEffect, useState } from 'react'
import axios from 'axios';
import moment from "moment"
import { FaCopy, FaCloudDownloadAlt } from 'react-icons/fa';
import JsFileDownloader from 'js-file-downloader';
import Navbar from '../navbar';

const AdminPrintJobs = () => {
    const [data, setData] = useState([])

    useEffect(() => {

        axios({
            method: "get",
            url: `${process.env.REACT_APP_API_BASE_URL}/api/admin/printBook`
        }).then((res) => {
            console.log("admin--printjobs----", res.data)
            setData(res.data)
        }).catch((err) => {

        })

    }, [])

    function copyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    const downloadPdfUrl = async (url) => {
        new JsFileDownloader({
            url: url,
        })
            .then(function (res) {
               
            })
            .catch(function (error) {
                
            });
    };

    const CopyDownload = ({ url }) => {
        const [copyClick, setCopyClick] = useState(false)
        const [downloadClick, setDownloadClick] = useState(false)

        const handleCopy=()=>{
            copyTextToClipboard(url)

            setCopyClick(true)
            setTimeout(() => {
                setCopyClick(false)
            }, 5000);

        }

        const handleDownload=()=>{
            downloadPdfUrl(url)

            setDownloadClick(true)
            setTimeout(() => {
                setDownloadClick(false)
            }, 10000);

        }

        return (
            <div className="flex justify-between w-full">
                <div className='w-full'>
                    <input
                        disabled
                        value={url}
                        type="text" className="bg-[#F0F2F6] appearance-none border rounded-md w-auto xl:w-full py-1 px-2 text-gray-400 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div className="flex items-center space-x-2">
                    <FaCopy
                        onClick={handleCopy}
                        color={copyClick ? '#0e4f5c' : '#9fc8b8'}
                        className="cursor-pointer w-7 h-6"
                    />
                    <FaCloudDownloadAlt
                        onClick={handleDownload}
                        color={downloadClick ? '#0e4f5c' : '#6A9190'}
                        className="cursor-pointer w-7 h-7"
                    />
                </div>
            </div>
        )
    }


    return (
        <div className='p-4 ml-64 h-screen'>
            <Navbar name={"Print Books"}/>
            { data.length>0?
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg min-h-screen">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                User Name
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Book Name
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Date
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Order
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Qty
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Charges
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Book Url
                            </th>
                            {/* <th scope="col" className="px-6 py-3">
                                Cover Url
                            </th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {
                            data?.map((book, i) =>
                                <tr className="bg-white border-b ">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {book?.user?.username}
                                    </th>
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {book?.book?.title}
                                    </th>
                                    <td className="px-6 py-4">
                                        {moment(book?.createdAt).format("MMM Do YY")}
                                    </td>
                                    <td className="px-6 py-4">
                                        {book?.orderId}
                                    </td>
                                    <td className="px-6 py-4">
                                        {book?.quantity}
                                    </td>
                                    <td className="px-6 py-4">
                                        ${book?.user_printCharges}
                                    </td>
                                    <td className="px-6 py-4">
                                        <CopyDownload url={book?.storyBookUrl}/>
                                    </td>
                                    {/* <td className="px-6 py-4">
                                        <CopyDownload url={book?.storyBookUrl}/>
                                    </td> */}
                                </tr>
                            ).reverse()
                        }

                    </tbody>
                </table>
                </div>:
                <div className='min-h-screen flex justify-center items-center h-96 w-full'>
                    <h1 className='text-xl font-semibold text-[#779B9A]'>Not have any Printed Book now.</h1>
                </div>
            }

        </div>
    )
}

export default AdminPrintJobs