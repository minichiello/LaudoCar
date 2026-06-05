"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-10">
        {/* Main Footer Content - 3 Columns */}
        <div className="flex flex-col md:flex-row md:justify-between gap-8 md:gap-12 mb-10">
          {/* Brand Column */}
          <div className="md:w-1/3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">LaudoCar</h3>
            </div>
          </div>

          {/* Links Column */}
          <div className="md:w-1/4">
            <h4 className="text-white font-semibold mb-3 text-base"></h4>
            <ul className="space-y-2 text-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>
                <Link href="/" className="text-white hover:text-gray-300 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Início
                </Link>
              </li>
              <li>
                <Link href="/novo-laudo" className="text-white hover:text-gray-300 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nova Vistoria
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Stack Column */}
          {/* <div className="md:w-1/3">
            <h4 className="text-white font-semibold mb-3 text-base">Tecnologias</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-800 px-2 py-1 rounded text-xs">Next.js</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-xs">TypeScript</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-xs">Tailwind CSS</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-xs">Ethers.js</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-xs">IPFS</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-xs">Sepolia</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-xs">Supabase</span>
            </div>
          </div> */}
        </div>

        {/* Copyright Row - Single Line */}
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-sm text-white">
            &copy; 2026 LaudoCar - Serviço de Laudos de Vistoria Descentralizado na Blockchain
          </p>
        </div>
      </div>
    </footer>
  );
}
