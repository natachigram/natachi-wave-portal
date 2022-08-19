import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import abi from './utils/wavePortal.json';

const App = () => {
  const [msg, setMsg] = useState('');
  const [waveMsg, setWaveMsg] = useState('');
  const [added, setAdded] = useState(false);
  //loading state when mining
  const [loading, setLoading] = useState(false);
  //display numbers of wave
  // const [overallWaves, setOverallWaves] = useState(0);

  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);
  //variable to hold contract Address
  const contractAddress = '0x6A88991909d704aC69412b26f4C7345AED112E87';

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //contract abi
  const contractABI = abi.abi;

  //state variable to store our user's public wallet
  const [currentAccount, setCurrentAccount] = useState('');

  const checkIfWalletIsConnected = async () => {
    try {
      /*
       * First make sure we have access to window.ethereum
       */
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make sure you have metamask!');
      } else {
        console.log('We have the ethereum object', ethereum);
      }

      //checking if we are allowed to access the users account

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account', account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };

  //implementing connect wallet method

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get Metamask!');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log('Retrieved total wave count...', count.toNumber());

        /*
         * Execute the actual wave from your smart contract
         */
        const waveTxn = await wavePortalContract.wave(waveMsg, {
          gasLimit: 300000,
        });
        setLoading(true);
        console.log('Mining...', waveTxn.hash);

        await waveTxn.wait();
        console.log('Mined -- ', waveTxn.hash);
        setLoading(false);
        count = await wavePortalContract.getTotalWaves();
        console.log('Retrieved total wave count...', count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleMsgChange = (e) => {
    setMsg(e.target.value);
  };

  //handling messsage inputs and submitting
  const handleSubmit = (e) => {
    e.preventDefault();
    setWaveMsg(msg);

    console.log(msg);
    setMsg('');
    setAdded(true);
  };

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className='mainContainer'>
      <div className='dataContainer'>
        <div className='header'>
          <span role='img' aria-label='hi'>
            👋
          </span>
          Hey there!
        </div>

        <div className='bio'>
          Hello, my name is Natachi. I am a web3 developer I am specializing in
          building exceptional digital experiences. Currently, I am focused on
          building accessible, human-centered products on the blockchain.
        </div>

        <div className='msg-container'>
          <form onSubmit={handleSubmit}>
            <input
              type='text'
              placeholder='Enter message'
              value={msg}
              onChange={handleMsgChange}
            />
            {added ? (
              <button disabled>Added to wave</button>
            ) : msg === '' ? (
              <button disabled id='empty'>
                Enter message
              </button>
            ) : (
              <button>Add to wave</button>
            )}
          </form>
        </div>

        {currentAccount && (
          <button className='waveButton' onClick={wave}>
            {loading ? (
              <img
                className='loader'
                src='https://c.tenor.com/NqKNFHSmbssAAAAi/discord-loading-dots-discord-loading.gif'
                alt='loader'
              />
            ) : (
              ' Wave at Me'
            )}
          </button>
        )}

        {!currentAccount && (
          <button className='waveButton connect-btn' onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} className='wave-msgs'>
              <div>
                <span>Address:</span> {wave.address}
              </div>
              <div>
                <span>Time:</span> {wave.timestamp.toString()}
              </div>
              <div>
                <span>Message:</span> {wave.message}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
