import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineClock } from 'react-icons/hi2'
import launchpadImg from '../../../assets/images/launchpad 2.png'
import KioskBlobsBackground, { DEFAULT_BACKGROUND_GRADIENT, DEFAULT_BLOB_GRADIENT } from '../components/KioskBlobsBackground'

const COLOR_PRIMARY = '#000000'
const COLOR_SECONDARY = '#333333'
const COLOR_DIVIDER = '#dde847'
const DIVIDER_LEFT_FADE = `linear-gradient(to right, transparent 0%, ${COLOR_DIVIDER} 100%)`
const DIVIDER_RIGHT_FADE = `linear-gradient(to left, transparent 0%, ${COLOR_DIVIDER} 100%)`

export default function KioskHome() {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      <KioskBlobsBackground backgroundGradient={DEFAULT_BACKGROUND_GRADIENT} blobGradient={DEFAULT_BLOB_GRADIENT} opacity={0.8} />

      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => navigate('/kiosk/history')}
          aria-label="View history logs"
          className="group relative overflow-hidden rounded-full border border-black/10 bg-[#dde847] px-5 py-3.5 text-sm font-extrabold tracking-wide text-black shadow-[0_14px_34px_rgba(221,232,71,0.32)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e4eb5c] hover:shadow-[0_18px_40px_rgba(221,232,71,0.42)] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
          <span className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.38)_0%,rgba(255,255,255,0.12)_35%,transparent_60%)] translate-x-[-75%] transition-transform duration-700 group-hover:translate-x-[120%]" />
          <span className="relative z-10 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-base leading-none">
              <HiOutlineClock size={18} />
            </span>
          View History Logs
          </span>
        </button>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full h-full max-w-6xl px-10 py-16 flex flex-col items-center justify-center touch-none select-none">
        {/* Logo Section */}
        <div className="mb-8 w-full flex items-center justify-center">
          <div className="w-44 h-44 rounded-full bg-[#dde847] shadow-[0_0_0_10px_rgba(221,232,71,0.2),0_12px_34px_rgba(0,0,0,0.15)] flex items-center justify-center">
            <img src={launchpadImg} alt="Launchpad logo" className="w-20 h-20 object-contain" />
          </div>
        </div>

        {/* Title */}
        <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-center tracking-tight" style={{ color: COLOR_PRIMARY }}>
          Launchpad Coworking
        </span>

        {/* Subtitle with Dividers */}
        <div className="mt-4 w-full max-w-3xl flex items-center justify-center gap-4 sm:gap-6">
          <div className="h-1 flex-1 max-w-36" style={{ backgroundImage: DIVIDER_LEFT_FADE }} />
          <span className="uppercase tracking-wide text-xl sm:text-2xl md:text-3xl font-medium whitespace-nowrap" style={{ color: COLOR_SECONDARY }}>
            Delivery Log System
          </span>
          <div className="h-1 flex-1 max-w-36" style={{ backgroundImage: DIVIDER_RIGHT_FADE }} />
        </div>

        {/* CTA Buttons */}
        <div className="mt-32 flex w-full max-w-[28rem] flex-col gap-4">
          <button
            onClick={() => navigate('/kiosk/new')}
            aria-label="Begin kiosk"
            className="group relative h-24 w-full rounded-[28px] overflow-hidden text-black bg-[#dde847] shadow-[0_16px_40px_rgba(221,232,71,0.35)] hover:shadow-[0_20px_46px_rgba(221,232,71,0.42)] active:scale-[0.98] transition-all duration-300 touch-manipulation focus:outline-none focus:ring-4 focus:ring-yellow-300"
          >
            <span className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.15)_32%,transparent_55%)] translate-x-[-70%] group-hover:translate-x-[120%] transition-transform duration-700" />
            <span className="relative z-10 flex h-full items-center justify-between px-7">
              <div className="text-2xl font-extrabold">Log New Delivery</div>
              <div className="h-12 w-12 rounded-2xl bg-black/10 border border-black/20 flex items-center justify-center text-2xl font-bold">→</div>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
