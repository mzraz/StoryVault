import React, { useState, useEffect } from 'react';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentElement } from '@stripe/react-stripe-js';
import { FaCopy } from 'react-icons/fa';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import { Country, State, City } from 'country-state-city';
import Footer from '../../components/Footer';
import './style.css';
import PopupAlert from "../../components/PopupAlert";
import jwtDecode from 'jwt-decode';


const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISH_KEY);

const CheckoutForm = ({ setMessage, amount, setAmount }) => {
  const userDetails = jwtDecode(localStorage.getItem("jwtToken"));
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const [cost, setCost] = useState();

  const [country, setCountry] = useState('US');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    email: userDetails.email,
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    phone: '',
    state_code: '',
    country: 'US',
  });

  const [voucherCode, setVoucherCode] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isValidVoucher, setValidVoucher] = useState(false)
  const [voucherMessage, setVoucherMessage] = useState('')

  useEffect(() => {
    setStates(State.getStatesOfCountry(country));
  }, [country]);

  const handleChange = (e) => {
    setFormData((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));
  };

  const handleStates = (e) => {
    const stateCode = e.target.value.split('-')[0];
    setFormData((prevState) => ({ ...prevState, [e.target.name]: stateCode }));
    if ([e.target.name] == 'state_code') {
      setCities(City.getCitiesOfState(country, stateCode));
    }
  };

  const getCost = async () => {
    await axios({
      method: 'POST',
      url: `${process.env.REACT_APP_API_BASE_URL}/api/createPayment`,
      data: {
        email: formData.email,
        name: formData.name,
        line1: formData.addressLine1,
        line2: formData.addressLine2,
        phone: formData.phone,
        country: formData.country,
        state: formData.state_code,
        city: formData.city,
      },
    })
      .then((res) => {
        console.log(res);
        setCost(res.data.user_charges);
        axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/update/userStatus`, { awsUserId: userDetails?.sub }
        ).then(()=>{
          navigate('/success');
        })
      })
      .catch((err) => { });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (paymentIntent) {
      console.log(paymentIntent)
      getCost();
      axios({
        method: 'POST',
        url: `${process.env.REACT_APP_API_BASE_URL}/api/welcomeEmail`,
        data: {
          recieverEmail: formData.email
        }
      })
    }
    console.log('Payment successful:', paymentIntent);
    console.log(paymentIntent);

    if (error) {
      setMessage(error.message)
      console.log(error.message);
    }

    setIsProcessing(false);
  };

  const getDiscount = async () => {
    await axios({
      method: 'POST',
      url: `${process.env.REACT_APP_API_BASE_URL}/api/check/voucherValidity`,
      data: {
        voucher_code: voucherCode,
        amount: amount
      }
    }).then((res) => {
      setAmount(0)
      setValidVoucher(true)
      setVoucherMessage(res.data.message)
    }).catch((err) => {
      setValidVoucher(false)
      setVoucherMessage(err.response.data.message)
    })

  }

  const handleContinue = async () => {
    await axios.post(
      `${process.env.REACT_APP_API_BASE_URL}/api/update/userStatus`, { awsUserId: userDetails?.sub }
    ).then((res) => {
      if (isValidVoucher && voucherCode) {
        axios({
          method: 'POST',
          url: `${process.env.REACT_APP_API_BASE_URL}/api/update/voucherStatus`,
          data: {
            voucher_code: voucherCode,
            email: formData.email
          }
        }).then((res) => {
          axios({
            method: 'POST',
            url: `${process.env.REACT_APP_API_BASE_URL}/api/welcomeEmail`,
            data: {
              recieverEmail: formData.email
            }
          })
          navigate('/success');
        }).catch((err) => {
          console.log(err);
        })
      }
      else {
        axios({
          method: 'POST',
          url: `${process.env.REACT_APP_API_BASE_URL}/api/welcomeEmail`,
          data: {
            recieverEmail: formData.email
          }
        })
        navigate('/success');
      }
    }).catch((err) => {
      console.log(err);
    })
  }

  const promoDiscount = async () => {
    await axios({
      method: "POST",
      url: `${process.env.REACT_APP_API_BASE_URL}/api/checkout/promocode`,
      data: {
        promo_code: promoCode,
        total_price: amount,
        awsUserId: userDetails?.sub,
      },
    }).then((res) => {
      setAmount(res.data.total_cost)
      setVoucherMessage('Promo code has been applied successfully.')
    })
      .catch((err) => {
        setVoucherMessage(err.response.data.message)
      });
  }

  const isValidated = !formData.name || !formData.addressLine1 || !formData.city || !formData.phone || !formData.state_code

  return (
    <>
      <div style={{ minHeight: '260px' }} className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-4">Payment Details</h1>
        <div>
          <label className=" text-[#30313d] text-transparent">Email</label>
          <input
            autoFocus
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-2 border border-inherit border: shadow-sm rounded-md mb-4"
            value={formData.email}
            disabled={true}
          />
          <label className=" text-[#30313d] text-transparent">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="w-full p-2 border border-inherit border: shadow-sm rounded-md mb-4"
            value={formData.name}
            onChange={handleChange}
          />

          <label className=" text-[#30313d] text-transparent">Address Line 1</label>
          <input
            type="text"
            name="addressLine1"
            placeholder="Address Line 1"
            className="w-full p-2 border border-inherit border: shadow-sm rounded-md mb-4"
            value={formData.addressLine1}
            onChange={handleChange}
          />
          <label className=" text-[#30313d] text-transparent">Address Line 2</label>
          <input
            type="text"
            name="addressLine2"
            placeholder="Address Line 2"
            className="w-full p-2 border border-inherit border: shadow-sm rounded-md mb-4"
            value={formData.addressLine2}
            onChange={handleChange}
          />

          <label className=" text-[#30313d] text-transparent">Phone</label>
          <input
            type="number"
            name="phone"
            placeholder="(201) 555-0123"
            className="w-full p-2 border border-inherit border: shadow-sm rounded-md mb-4"
            value={formData.phone}
            onChange={handleChange}
          />
          <label className=" text-[#30313d] text-transparent" htmlFor="country_code">
            Country
          </label>

          <input
            className="shadow bg-[#F0F2F6]  border border-inherit border:shadow-sm rounded-md  w-full p-2 mb-4  text-gray-400 leading-tight focus:outline-none focus:shadow-outline"
            id="country_code"
            type="text"
            name="country_code"
            disabled
            placeholder="US"
            value={formData.country}
          />
          <label className=" text-[#30313d] text-transparent" htmlFor="state_code">
            State
          </label>

          <select
            className="w-full p-2 border border-inherit border: shadow-sm rounded-md mb-4"
            id="state_code"
            type="text"
            name="state_code"
            placeholder="NY"
            value={formData.state_code}
            onChange={handleStates}
          >
            <option>Select State</option>
            {states.map((item, index) => (
              <option key={index} value={item.isoCode}>
                {item.name}-{item.isoCode}
              </option>
            ))}
          </select>
          <label className=" text-[#30313d] text-transparent" htmlFor="city">
            City
          </label>
          {cities.length != 0 ? (
            <select
              className="w-full p-2 border border-inherit border: shadow-sm rounded-md mb-4"
              id="city"
              type="text"
              name="city"
              placeholder="Testtown"
              value={formData.city}
              onChange={handleChange}
            >
              <option>Select City</option>
              {cities.map((item, index) => (
                <option key={index} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="w-full p-2 border border-inherit border: shadow-sm rounded-md mb-4"
              id="city"
              type="text"
              name="city"
              disabled
              placeholder="Testtown"
              value={formData.city}
              onChange={handleChange}
            ></select>
          )}
        </div>
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-600">Apply Gift Voucher:</p>

            <div className='flex space-x-2'>
              <input
                className="shadow bg-[#F0F2F6] appearance-none border rounded w-28 py-1 px-2 leading-tight focus:outline-none focus:shadow-outline"
                id="voucher"
                type="text"
                name="voucher"
                minLength={7}
                maxLength={7}
                placeholder=""
                onChange={(e) => { setVoucherCode(e.target.value) }}
                value={voucherCode}
              />
              <button onClick={getDiscount} disabled={voucherCode.length !== 7} className={`${voucherCode?.length !== 7 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#134f5c] cursor-pointer'} text-white text-sm font-medium py-1 px-2 rounded-md`}>
                Apply
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <p className="font-semibold text-gray-600">Apply Promo Code:</p>

            <div className='flex space-x-2'>
              <input
                className="shadow bg-[#F0F2F6] appearance-none border rounded w-28 py-1 px-2 leading-tight focus:outline-none focus:shadow-outline"
                id="voucher"
                type="text"
                name="voucher"
                minLength={1}
                maxLength={15}
                placeholder=""
                onChange={(e) => { setPromoCode(e.target.value) }}
                value={promoCode}
              />
              <button onClick={promoDiscount} disabled={!promoCode} className={`${!promoCode ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#134f5c] cursor-pointer'} text-white text-sm font-medium py-1 px-2 rounded-md`}>
                Apply
              </button>
            </div>
          </div>

          {<p className={`h-3 ${isValidVoucher || voucherMessage.includes('Promo code') ? 'text-green-600' : 'text-red-600'}`}>{voucherMessage}</p>}
        </div>

        {isValidVoucher || amount === 0 ? <></> : <PaymentElement />}
        {
          isValidVoucher || amount === 0 ?
            <button
              disabled={isValidated}
              className={`mt-6 w-full text-white ${!isValidated ? 'bg-[#124E5B] cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}  font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline`}
              onClick={handleContinue}
              type="button"
            >
              {isProcessing ? 'Processing...' : 'Continue'}
            </button> :
            <button
              disabled={isValidated}
              className={`mt-6 w-full text-white ${!isValidated ? 'bg-[#124E5B] cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}  font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline`}
              onClick={handleSubmit}
              type="button"
            >
              {isProcessing ? 'Processing...' : `Pay $${amount}`}
            </button>
        }

      </div>
    </>
  );
};

export default function Checkout() {

  const [clientSecret, setClientSecret] = useState(
    ''
  );
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(139);

  useEffect(() => {
    async function getClientSecret() {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/checkout/stripePayment`, { amount: amount });
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error('Error fetching client secret:', error);
      }
    }
    getClientSecret();
  }, []);

  return (
    <div className="bg-gray-100 h-full">
      <PopupAlert msg={message} bgcolor='bg-red-600' width='w-1/2' />

      <div className="flex h-full">
        <div className="nav">
          <NavBar />
        </div>
      </div>

      <div className="w-full h-auto pt-44 pb-20 grid grid-cols-1x xl:grid-cols-2 px-28">
        <div className="h-80 flex flex-col">
          <div className="relative flex flex-col justify-start items-start w-1/2 h-2/3 shadow-xl bg-white rounded-lg p-10">
            <p className="text-3xl font-bold text-[#134F5C] mb-3">Checkout</p>
            <div className="flex justify-between space-x-6">
              <h1 className="text-2xl font-medium text-black text-center mb-10">Price:</h1>
              <h1 className="text-2xl font-medium text-[#6a9190] text-center mb-10">${amount}</h1>
            </div>
            <div className="mb-4 "></div>
          </div>
        </div>
        {stripePromise && clientSecret && (
          <div className="">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm setMessage={setMessage} amount={amount} setAmount={setAmount} />
            </Elements>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}