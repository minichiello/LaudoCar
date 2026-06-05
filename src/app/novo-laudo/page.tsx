"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";
import { createLaudo } from "@/lib/supabase";
import { registrarLaudoOnChain } from "@/lib/contract";

export default function NovoLaudo() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "uploading" | "blockchain" | "success">("form");
  const [generatedUuid] = useState(() => uuidv4());

  // Form fields
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);

  // Progress
  const [uploadProgress, setUploadProgress] = useState("");
  const [blockchainProgress, setBlockchainProgress] = useState("");
  const [error, setError] = useState("");
  const [laudoId, setLaudoId] = useState("");

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      alert("Máximo de 5 fotos permitido");
      return;
    }
    setFotoFiles(files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pdfFile) {
      setError("O PDF do laudo é obrigatório");
      return;
    }

    try {
      // Step 1: Upload to IPFS
      setStep("uploading");
      setUploadProgress("Enviando arquivos para IPFS...");

      const formData = new FormData();
      formData.append("uuid", generatedUuid);
      formData.append("files", pdfFile);
      fotoFiles.forEach((foto) => formData.append("files", foto));

      const uploadRes = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Falha no upload para IPFS");
      }

      const { cids } = await uploadRes.json();
      const pdfCid = cids[0];
      const fotoCids = cids.slice(1);

      setUploadProgress("Arquivos enviados com sucesso!");

      // Step 2: Blockchain registration with MetaMask
      setStep("blockchain");
      setBlockchainProgress("Aguardando MetaMask...");

      if (!window.ethereum) {
        throw new Error("MetaMask não instalada");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      setBlockchainProgress("Registrando na blockchain...");

      const { txHash, idBlockchain } = await registrarLaudoOnChain(
        signer,
        generatedUuid,
        placa.toUpperCase(),
        marca,
        modelo,
        parseInt(ano),
        pdfCid,
        fotoCids
      );

      setBlockchainProgress("Transação confirmada! Salvando no banco...");

      // Step 3: Save to Supabase
      await createLaudo({
        placa: placa.toUpperCase(),
        marca,
        modelo,
        ano: parseInt(ano),
        ipfs_pdf_cid: pdfCid,
        ipfs_fotos_cid: fotoCids,
        tx_hash: txHash,
        id_blockchain: idBlockchain,
      });

      setLaudoId(generatedUuid);
      setStep("success");
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Erro ao criar laudo");
      setStep("form");
    }
  }

  if (step === "success") {
    const viewUrl = `${window.location.origin}/laudo/${laudoId}`;

    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-800 mb-4">
            Laudo Registrado com Sucesso!
          </h1>
          <p className="text-green-700 mb-6">
            O laudo foi registrado na blockchain e salvo no banco de dados.
          </p>

          <div className="bg-white rounded-lg p-4 mb-6 inline-block">
            <QRCodeSVG value={viewUrl} size={200} />
          </div>

          <p className="text-sm text-gray-600 mb-2">Link para consulta:</p>
          <a
            href={viewUrl}
            className="text-blue-600 font-mono text-sm break-all hover:underline"
          >
            {viewUrl}
          </a>

          <div className="mt-8 flex gap-4 justify-center">
            <Link
              href="/"
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg"
            >
              Voltar ao Dashboard
            </Link>
            <Link
              href={`/laudo/${laudoId}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Ver Laudo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">Nova Vistoria</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Registrar Nova Vistoria</h1>
        <p className="text-gray-600 mt-1">
          Preencha os dados do veículo e anexe os arquivos para registro na blockchain
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Dados do Veículo</h2>
                  <p className="text-sm text-gray-500">Informações básicas do veículo vistoriado</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="ABC1D23"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={2100}
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Corolla"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">Identificador Único</span>
                </div>
                <input
                  type="text"
                  disabled
                  value={generatedUuid}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded text-sm font-mono text-blue-800"
                />
                <p className="text-xs text-blue-600 mt-1">
                  Este UUID será usado para identificar o laudo no sistema
                </p>
              </div>
            </div>
          </div>

          {/* Files Upload Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Arquivos</h2>
                  <p className="text-sm text-gray-500">Anexe o laudo em PDF e fotos do veículo</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  PDF do Laudo <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${pdfFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer block">
                    {pdfFile ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{pdfFile.name}</p>
                          <p className="text-sm text-green-600">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600">Clique para selecionar ou arraste o PDF</p>
                        <p className="text-xs text-gray-400 mt-1">Apenas arquivos PDF</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Photos Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Fotos do Veículo <span className="text-gray-400">(Opcional, máx. 5)</span>
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${fotoFiles.length > 0 ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFotoChange}
                    className="hidden"
                    id="foto-upload"
                  />
                  <label htmlFor="foto-upload" className="cursor-pointer block">
                    {fotoFiles.length > 0 ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{fotoFiles.length} foto(s) selecionada(s)</p>
                          <p className="text-sm text-green-600">Clique para alterar</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600">Clique para selecionar fotos</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP (máx. 5 arquivos)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Registrar Laudo na Blockchain
          </button>
        </form>
      )}

      {/* Uploading State */}
      {step === "uploading" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="relative mb-6 w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-full h-full text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Enviando arquivos</h3>
          <p className="text-gray-600">{uploadProgress}</p>
          <div className="mt-4 w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3"></div>
          </div>
        </div>
      )}

      {/* Blockchain State */}
      {step === "blockchain" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="relative mb-6 w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-100 border-t-purple-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-full h-full text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Registrando na Blockchain</h3>
          <p className="text-gray-600 mb-4">{blockchainProgress}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-yellow-800">
                Confirme a transação na MetaMask para continuar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
