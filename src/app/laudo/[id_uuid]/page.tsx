"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLaudoById, Laudo } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

interface PageProps {
  params: Promise<{ id_uuid: string }>;
}

export default function LaudoPage({ params }: PageProps) {
  const [laudo, setLaudo] = useState<Laudo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [idUuid, setIdUuid] = useState<string>("");

  // Integrity checker state
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [verifyMessage, setVerifyMessage] = useState("");

  useEffect(() => {
    params.then(({ id_uuid }) => {
      setIdUuid(id_uuid);
      loadLaudo(id_uuid);
    });
  }, [params]);

  async function loadLaudo(id: string) {
    try {
      const data = await getLaudoById(id);
      if (!data) {
        setError("Laudo não encontrado");
      } else {
        setLaudo(data);
      }
    } catch (err) {
      console.error("Error loading laudo:", err);
      setError("Erro ao carregar laudo");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyFile || !laudo) return;

    setVerifyStatus("checking");
    setVerifyMessage("Calculando hash SHA-256...");

    try {
      // Calculate SHA-256 hash of the uploaded file
      const arrayBuffer = await verifyFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Fetch the original PDF from IPFS and calculate its hash
      setVerifyMessage("Buscando laudo original no IPFS...");
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${laudo.ipfs_pdf_cid}`);
      if (!response.ok) {
        throw new Error("Não foi possível buscar o laudo original");
      }

      const originalArrayBuffer = await response.arrayBuffer();
      const originalHashBuffer = await crypto.subtle.digest("SHA-256", originalArrayBuffer);
      const originalHashArray = Array.from(new Uint8Array(originalHashBuffer));
      const originalHash = originalHashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Compare hashes
      if (calculatedHash === originalHash) {
        setVerifyStatus("valid");
        setVerifyMessage("✅ Laudo Autêntico e Íntegro! O arquivo é idêntico ao registrado na blockchain.");
      } else {
        setVerifyStatus("invalid");
        setVerifyMessage("❌ Laudo Não Confere! O arquivo foi alterado ou é diferente do original.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setVerifyStatus("invalid");
      setVerifyMessage("❌ Erro na verificação: " + err.message);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="relative mb-6 w-16 h-16 mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg className="w-full h-full text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Carregando laudo...</h2>
      </div>
    );
  }

  if (error || !laudo) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-800 mb-2">{error || "Laudo não encontrado"}</h1>
          <p className="text-red-600 mb-4">Verifique o ID e tente novamente</p>
          <Link href="/" className="inline-flex items-center text-blue-600 hover:underline font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const viewUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">Laudo {laudo.id.substring(0, 8)}...</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laudo de Vistoria</h1>
            <p className="text-gray-600 mt-1">Visualize os detalhes do laudo registrado na blockchain</p>
          </div>
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">Registro Confirmado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vehicle Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Informações do Veículo</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Placa</p>
                  <p className="text-2xl font-bold text-gray-900">{laudo.placa}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Marca</p>
                  <p className="text-lg font-semibold text-gray-900">{laudo.marca}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Modelo</p>
                  <p className="text-lg font-semibold text-gray-900">{laudo.modelo}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ano</p>
                  <p className="text-lg font-semibold text-gray-900">{laudo.ano}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Files Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Arquivos Anexados</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* PDF */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">PDF do Laudo</p>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${laudo.ipfs_pdf_cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-red-200 transition-colors">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Laudo em PDF</p>
                    <p className="text-sm text-gray-500">Clique para visualizar no IPFS</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Photos */}
              {laudo.ipfs_fotos_cid && laudo.ipfs_fotos_cid.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Fotos do Veículo</p>
                  <div className="grid grid-cols-2 gap-3">
                    {laudo.ipfs_fotos_cid.map((cid, index) => (
                      <a
                        key={index}
                        href={`https://gateway.pinata.cloud/ipfs/${cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={`https://gateway.pinata.cloud/ipfs/${cid}`}
                          alt={`Foto ${index + 1}`}
                          className="w-full aspect-video object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="aspect-video bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                                <span>Foto ${index + 1}</span>
                              </div>
                            `;
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Integrity Checker Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Verificador de Integridade</h2>
                  <p className="text-sm text-gray-500">Compare com um PDF local</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Faça upload do PDF do laudo que você possui para verificar se ele é autêntico e idêntico ao registrado.
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                      id="verify-file"
                    />
                    {verifyFile && (
                      <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {verifyFile.name}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!verifyFile || verifyStatus === "checking"}
                    className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {verifyStatus === "checking" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Verificando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verificar
                      </>
                    )}
                  </button>
                </div>

                {verifyStatus !== "idle" && (
                  <div
                    className={`rounded-xl p-4 ${
                      verifyStatus === "valid"
                        ? "bg-green-50 border border-green-200"
                        : verifyStatus === "invalid"
                        ? "bg-red-50 border border-red-200"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    {verifyStatus === "checking" && (
                      <div className="flex items-center text-blue-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                        {verifyMessage}
                      </div>
                    )}
                    {verifyStatus === "valid" && (
                      <div className="flex items-start gap-3 text-green-800">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold">Laudo Autêntico e Íntegro!</p>
                          <p className="text-sm">{verifyMessage}</p>
                        </div>
                      </div>
                    )}
                    {verifyStatus === "invalid" && (
                      <div className="flex items-start gap-3 text-red-800">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold">Laudo Não Confere!</p>
                          <p className="text-sm">{verifyMessage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* QR Code Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">QR Code do Laudo</h3>
            <div className="bg-white p-3 rounded-lg inline-block shadow-sm border border-gray-200 mb-3">
              <QRCodeSVG value={viewUrl} size={160} />
            </div>
            <p className="text-xs text-gray-500">Escaneie para acessar este laudo</p>
          </div>

          {/* Blockchain Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Blockchain</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rede</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Sepolia Testnet</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ID na Blockchain</p>
                <p className="font-mono text-sm text-gray-900 bg-gray-100 px-3 py-2 rounded">
                  {laudo.id_blockchain || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hash da Transação</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${laudo.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-blue-600 hover:text-blue-800 break-all bg-blue-50 px-3 py-2 rounded block"
                >
                  {laudo.tx_hash.substring(0, 20)}...
                  <span className="text-xs block mt-1 text-blue-400">Ver no Etherscan →</span>
                </a>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data do Registro</p>
                <p className="text-sm text-gray-900">{formatDate(laudo.created_at)}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
