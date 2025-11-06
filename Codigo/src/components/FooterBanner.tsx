import React from "react";
import { Facebook, Instagram, X } from "lucide-react";
import logo from 'figma:asset/2b2a7f5a35cc2954a161c6344ab960a250a1a60d.png';

export function FooterBanner() { 
  return (
    <footer className="w-full bg-gradient-to-r from-blue-200 via-blue-100 to-white text-black py-12 mt-20">
      <div className="container mx-auto px-8 flex flex-row justify-between items-center gap-10">

        {/* Sección izquierda */}
        <div className="flex flex-col justify-center">
          <h2 className="text-lg font-semibold">Innovación</h2>
          <p className="text-sm text-gray-700">
            Avance educativo, inteligencia artificial y tecnología.
          </p>

          <div className="flex gap-4 mt-4 text-black">
            <Facebook className="w-5 h-5 hover:text-blue-600 transition" />
            <Instagram className="w-5 h-5 hover:text-pink-600 transition" />
            <X className="w-5 h-5 hover:text-gray-600 transition" />
          </div>

          <p className="text-xs text-gray-600 mt-4">
            Aniuet © {new Date().getFullYear()}. Todos los derechos reservados.
          </p>
        </div>

        {/* Logo */}
        <div className="flex justify-center items-center">
          <img
            src={logo}
            alt="Aniuet Logo"
            className="w-24 opacity-90 hover:opacity-100 transition duration-300"
          />
        </div>

        {/* Sección derecha */}
        <div className="flex flex-col justify-center text-right">
          <p className="text-sm text-gray-700 mb-2">contacto@aniuet.com</p>
          <label className="text-sm block mb-1">Ingresa tu correo electrónico aquí</label>

          <div className="flex justify-end items-center mt-2">
             <input
               type="email"
               placeholder="Tu correo electrónico aquí"
               className="w-48 rounded-full px-3 py-1.5 text-sm text-black border border-gray-300 focus:outline-none"
              />
           <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 ml-2 text-sm rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
                     Enviar
           </button>
          </div>
        </div>
      </div>
    </footer>
  );
}