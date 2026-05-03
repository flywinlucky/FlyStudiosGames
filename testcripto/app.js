"use strict";

const connectWalletBtn = document.getElementById("connectWalletBtn");
const buyTicketBtn = document.getElementById("buyTicketBtn");

const walletAddressEl = document.getElementById("walletAddress");
const walletBalanceEl = document.getElementById("walletBalance");
const walletNetworkEl = document.getElementById("walletNetwork");
const statusMessageEl = document.getElementById("statusMessage");

const contractAddress = "0x0000000000000000000000000000000000000000"; // Replace with your contract address.
const contractABI = []; // Replace with your contract ABI.

const NETWORK_NAMES = {
    1: "Ethereum Mainnet",
    5: "Goerli",
    10: "Optimism",
    56: "BNB Smart Chain",
    137: "Polygon",
    42161: "Arbitrum One",
    43114: "Avalanche C-Chain",
    8453: "Base",
    11155111: "Sepolia"
};

const walletState = {
    provider: null,
    signer: null,
    address: "",
    networkName: "Unknown",
    chainId: null,
    listenersBound: false
};

function shortenAddress(address) {
    if (!address || address.length < 10) {
        return address || "N/A";
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getFriendlyNetworkName(network) {
    if (!network) {
        return "Unknown";
    }

    return NETWORK_NAMES[network.chainId] || network.name || `Chain ${network.chainId}`;
}

function setStatus(message, type = "info") {
    statusMessageEl.textContent = message;
    statusMessageEl.classList.remove("error", "success");

    if (type === "error") {
        statusMessageEl.classList.add("error");
    }

    if (type === "success") {
        statusMessageEl.classList.add("success");
    }
}

function setBuyButtonState(enabled) {
    buyTicketBtn.disabled = !enabled;
    buyTicketBtn.classList.toggle("btn-disabled", !enabled);
}

function resetWalletView() {
    walletAddressEl.textContent = "Not connected";
    walletBalanceEl.textContent = "0.0000 ETH";
    walletNetworkEl.textContent = "Unknown";
    walletState.signer = null;
    walletState.address = "";
    walletState.networkName = "Unknown";
    walletState.chainId = null;
    setBuyButtonState(false);
}

async function updateWalletView(address) {
    const balanceBn = await walletState.provider.getBalance(address);
    const network = await walletState.provider.getNetwork();

    const balanceEth = Number.parseFloat(ethers.utils.formatEther(balanceBn)).toFixed(4);
    const networkName = getFriendlyNetworkName(network);

    walletState.address = address;
    walletState.networkName = networkName;
    walletState.chainId = network.chainId;

    walletAddressEl.textContent = shortenAddress(address);
    walletBalanceEl.textContent = `${balanceEth} ETH`;
    walletNetworkEl.textContent = networkName;

    const walletDebug = {
        address,
        shortAddress: shortenAddress(address),
        balanceEth,
        networkName,
        chainId: network.chainId,
        connectedAt: new Date().toISOString()
    };

    console.log("Wallet debug JSON:", JSON.stringify(walletDebug, null, 2));
}

function bindProviderEvents() {
    if (!window.ethereum || walletState.listenersBound) {
        return;
    }

    window.ethereum.on("accountsChanged", async (accounts) => {
        if (!accounts || accounts.length === 0) {
            resetWalletView();
            setStatus("Wallet disconnected. Please reconnect to continue.", "error");
            return;
        }

        try {
            await updateWalletView(accounts[0]);
            setStatus("Wallet account updated.", "success");
        } catch (error) {
            console.error("Failed to refresh account:", error);
            setStatus("Could not refresh wallet account data.", "error");
        }
    });

    window.ethereum.on("chainChanged", async () => {
        try {
            const accounts = await walletState.provider.listAccounts();
            if (accounts.length > 0) {
                await updateWalletView(accounts[0]);
                setStatus("Network changed and wallet data was refreshed.", "success");
            }
        } catch (error) {
            console.error("Failed to refresh after network change:", error);
            setStatus("Could not refresh wallet after network change.", "error");
        }
    });

    walletState.listenersBound = true;
}

async function connectWallet() {
    if (!window.ethereum) {
        setStatus("No wallet detected. Install MetaMask or Trust Wallet and try again.", "error");
        return;
    }

    try {
        walletState.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        await walletState.provider.send("eth_requestAccounts", []);

        walletState.signer = walletState.provider.getSigner();
        const address = await walletState.signer.getAddress();

        await updateWalletView(address);
        setBuyButtonState(true);
        bindProviderEvents();

        setStatus("Wallet connected successfully.", "success");
    } catch (error) {
        console.error("Connection error:", error);

        if (error && error.code === 4001) {
            setStatus("Connection request rejected. Please approve wallet access to continue.", "error");
            return;
        }

        setStatus("Failed to connect wallet. Please try again.", "error");
    }
}

async function buyTicket() {
    if (!walletState.signer) {
        setStatus("Connect your wallet before buying a ticket.", "error");
        return;
    }

    if (!ethers.utils.isAddress(contractAddress) || contractAddress === "0x0000000000000000000000000000000000000000") {
        setStatus("Please set a valid contractAddress in app.js before buying tickets.", "error");
        return;
    }

    const ticketPrice = ethers.utils.parseEther("0.01");
    let transaction;

    try {
        setStatus("Sending transaction... Confirm it in your wallet.");
        setBuyButtonState(false);

        if (Array.isArray(contractABI) && contractABI.length > 0) {
            const contract = new ethers.Contract(contractAddress, contractABI, walletState.signer);

            if (typeof contract.buyTicket === "function") {
                transaction = await contract.buyTicket({ value: ticketPrice });
            } else {
                transaction = await walletState.signer.sendTransaction({
                    to: contractAddress,
                    value: ticketPrice
                });
            }
        } else {
            transaction = await walletState.signer.sendTransaction({
                to: contractAddress,
                value: ticketPrice
            });
        }

        setStatus(`Transaction sent: ${transaction.hash}. Waiting for confirmation...`);

        const receipt = await transaction.wait();
        setStatus(`Ticket purchased successfully in block ${receipt.blockNumber}.`, "success");

        const txDebug = {
            action: "buyTicket",
            contractAddress,
            amountEth: "0.01",
            txHash: transaction.hash,
            receiptStatus: receipt.status,
            blockNumber: receipt.blockNumber,
            confirmedAt: new Date().toISOString()
        };

        console.log("Transaction debug JSON:", JSON.stringify(txDebug, null, 2));

        await updateWalletView(walletState.address);
    } catch (error) {
        console.error("buyTicket error:", error);

        if (error && error.code === 4001) {
            setStatus("Transaction cancelled by user.", "error");
            return;
        }

        setStatus("Transaction failed. Check your wallet, network, and contract details.", "error");
    } finally {
        setBuyButtonState(true);
    }
}

async function initialize() {
    if (!window.ethereum) {
        setStatus("No wallet detected. Install MetaMask or Trust Wallet to use this page.", "error");
        return;
    }

    walletState.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    bindProviderEvents();

    try {
        const accounts = await walletState.provider.listAccounts();

        if (accounts.length > 0) {
            walletState.signer = walletState.provider.getSigner();
            await updateWalletView(accounts[0]);
            setBuyButtonState(true);
            setStatus("Wallet already connected.", "success");
        }
    } catch (error) {
        console.error("Initialization error:", error);
        setStatus("Wallet was detected, but account data could not be loaded.", "error");
    }
}

connectWalletBtn.addEventListener("click", connectWallet);
buyTicketBtn.addEventListener("click", buyTicket);

window.buyTicket = buyTicket;

initialize();
