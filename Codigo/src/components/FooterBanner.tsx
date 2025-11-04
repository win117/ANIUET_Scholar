import React from "react";
import { Facebook, Instagram, X } from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

export function FooterBanner() {
  return (
    <footer className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-12 mt-20">
      {/* ...existing code... */}
      <div className="w-full px-8 flex flex-col md:flex-row justify-between items-center gap-10">
        {/* Sección izquierda */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <h2 className="text-lg font-semibold">Innovación</h2>
          <p className="text-sm text-gray-300">
            Avance educativo, inteligencia artificial y tecnología.
          </p>
          <div className="flex justify-center md:justify-start gap-4 mt-4">
            <a href="#" aria-label="Facebook" className="hover:text-blue-400 transition">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-pink-400 transition">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" aria-label="X" className="hover:text-gray-400 transition">
              <X className="w-5 h-5" />
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Aniuet © {new Date().getFullYear()}. Todos los derechos reservados.
          </p>
        </div>

        {/* Logo central */}
        <div className="flex justify-center">
          <img
            src={logo}
            alt="Aniuet Logo"
            className="w-24 opacity-90 hover:opacity-100 transition duration-300"
          />
        </div>

        {/* Sección derecha */}
        <div className="flex-1 w-full text-center md:text-right">
          <p className="text-sm text-gray-300 mb-2">contacto@aniuet.com</p>
          <label className="text-sm block mb-1">Ingresa tu correo electrónico aquí</label>

          <div className="flex justify-center md:justify-end items-center mt-2">
            <input
              type="email"
              placeholder="Tu correo electrónico aquí"
              className="w-64 rounded-full p-2 text-black focus:outline-none"
            />
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 ml-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
              Enviar consulta
            </button>
          </div>
        </div>
      </div>
      {/* ...existing code... */}
    </footer>
  );
}