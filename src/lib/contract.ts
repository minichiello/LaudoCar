import { ethers } from "ethers";

// ABI do contrato LaudoCar
export const LAUDOCAR_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_uuid", type: "string" },
      { internalType: "string", name: "_placa", type: "string" },
      { internalType: "string", name: "_marca", type: "string" },
      { internalType: "string", name: "_modelo", type: "string" },
      { internalType: "uint16", name: "_ano", type: "uint16" },
      { internalType: "string", name: "_ipfsPdfCID", type: "string" },
      { internalType: "string[]", name: "_ipfsFotosCID", type: "string[]" },
    ],
    name: "registrarLaudo",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "laudos",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "vistoriador", type: "address" },
      { internalType: "string", name: "ipfsPdfCID", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_placa", type: "string" }],
    name: "obterLaudosPorPlaca",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "vistoriador", type: "address" },
      { indexed: false, internalType: "string", name: "placa", type: "string" },
      { indexed: false, internalType: "string", name: "ipfsPdfCID", type: "string" },
    ],
    name: "LaudoRegistrado",
    type: "event",
  },
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

export function getContractWithSigner(signer: ethers.Signer) {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, LAUDOCAR_ABI, signer);
}

export function getContractForRead() {
  if (!CONTRACT_ADDRESS || !SEPOLIA_RPC_URL) {
    throw new Error("Contract address or RPC URL not configured");
  }
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, LAUDOCAR_ABI, provider);
}

export async function registrarLaudoOnChain(
  signer: ethers.Signer,
  uuid: string,
  placa: string,
  marca: string,
  modelo: string,
  ano: number,
  ipfsPdfCID: string,
  ipfsFotosCID: string[]
): Promise<{ txHash: string; idBlockchain: number }> {
  const contract = getContractWithSigner(signer);

  const tx = await contract.registrarLaudo(
    uuid,
    placa,
    marca,
    modelo,
    ano,
    ipfsPdfCID,
    ipfsFotosCID
  );

  const receipt = await tx.wait();

  // Parse event to get the ID
  const event = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed: any) => parsed?.name === "LaudoRegistrado");

  const idBlockchain = event ? Number(event.args.id) : 0;

  return {
    txHash: receipt.hash,
    idBlockchain,
  };
}
