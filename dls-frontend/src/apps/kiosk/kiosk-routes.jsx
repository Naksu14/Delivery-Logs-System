import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import KioskHome from './pages/KioskHome'
import KioskForms from './pages/KioskForms'
import KioskSuccess from './pages/KioskSuccess'
import KioskHistoryLogs from './pages/KioskHistorylogs'

export default function KioskRoutes() {
	useEffect(() => {
		const enterFullscreen = async () => {
			try {
				if (document.fullscreenElement) return
				if (navigator.userActivation && !navigator.userActivation.isActive) return
				if (document.documentElement.requestFullscreen) {
					await document.documentElement.requestFullscreen()
				}
			} catch {
				// Ignore blocked fullscreen requests.
			}
		}

		const retryOnGesture = () => {
			enterFullscreen()
		}

		document.addEventListener('click', retryOnGesture, { once: true })
		document.addEventListener('touchstart', retryOnGesture, { once: true })
		document.addEventListener('keydown', retryOnGesture, { once: true })

		return () => {
			document.removeEventListener('click', retryOnGesture)
			document.removeEventListener('touchstart', retryOnGesture)
			document.removeEventListener('keydown', retryOnGesture)
		}
	}, [])

	return (
		<Routes>
			<Route path="/" element={<KioskHome />} />
			<Route path="/new" element={<KioskForms />} />
			<Route path="/success" element={<KioskSuccess />} />
			<Route path="/history" element={<KioskHistoryLogs />} />
		</Routes>
	)
}
