
import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

interface ShortenedUrl {
  _id: string
  originalUrl: string
  shortUrl: string
  customName?: string
  user: string
  expiryDate: string
  createdAt: string
  completeShortUrl: string
}

interface ApiResponse {
  message: string
  shortUrl: string
  customName: string
  validityPeriod: string
  expiryDate: string
}

export default function Dashboard() {
  const [urls, setUrls] = useState<ShortenedUrl[]>([])
  const [urlsLoading, setUrlsLoading] = useState(true)
  const [formData, setFormData] = useState({
    originalUrl: "",
    customName: "",
    validityPeriod: "7days",
  })
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<ApiResponse | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("urltoken")
    const email = localStorage.getItem("userEmail")

    if (!token) {
      navigate("/")
      return
    }

    setUserEmail(email || "")
    fetchUserUrls(token)
  }, [navigate])

  const fetchUserUrls = async (token: string) => {
    try {
      setUrlsLoading(true)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
      
      const response = await fetch(`${API_BASE_URL}/api/url/myurls`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch URLs")
      }

      const data = await response.json()
      console.log('API response:', data)
      
      // Extract URLs from the response
      let urlsArray: ShortenedUrl[] = []
      if (data && data.urls && Array.isArray(data.urls)) {
        urlsArray = data.urls
      } else if (Array.isArray(data)) {
        urlsArray = data
      } else if (data && typeof data === 'object') {
        // Convert object with numeric keys to array
        urlsArray = Object.values(data).filter(item => 
          typeof item === 'object' && item !== null && '_id' in item
        ) as ShortenedUrl[]
      }
      
      console.log('Processed URLs array:', urlsArray)
      setUrls(urlsArray)
    } catch (error) {
      console.error("Error fetching URLs:", error)
      setUrls([])
    } finally {
      setUrlsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("urltoken")
      if (!token) {
        navigate("/")
        return
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
      
      const requestBody: any = {
        originalUrl: formData.originalUrl,
        validityPeriod: formData.validityPeriod,
      }

      // Only add customName if it's provided
      if (formData.customName.trim()) {
        requestBody.customName = formData.customName
      }

      console.log('Request body:', requestBody)

      const response = await fetch(`${API_BASE_URL}/api/url/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create short URL")
      }

      // Show the created URL in modal
      setCreatedUrl(data)
      setShowModal(true)

      // Reset form
      setFormData({
        originalUrl: "",
        customName: "",
        validityPeriod: "7days",
      })

      // Refresh the URLs list
      fetchUserUrls(token)

    } catch (error) {
      console.error("Error creating short URL:", error)
      alert(error instanceof Error ? error.message : "Failed to create short URL")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    console.log('Input changed:', e.target.name, e.target.value)
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLogout = () => {
    localStorage.removeItem("urltoken")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("isAuthenticated")
    navigate("/")
  }

  const getValidityStatus = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)

    if (now > expiry) {
      return { status: "Expired", color: "text-red-500" }
    }

    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      status: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`,
      color: daysLeft <= 2 ? "text-yellow-500" : "text-green-500",
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const closeModal = () => {
    setShowModal(false)
    setCreatedUrl(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="shadow-sm" style={{ backgroundColor: "#683FC1" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Short<span style={{ color: "#C7EF00" }}>Link</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-white border border-white hover:bg-white hover:text-purple-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* URL Shortener Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Shorten URL</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Original URL
                  </label>
                  <input
                    type="url"
                    id="originalUrl"
                    name="originalUrl"
                    value={formData.originalUrl}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="https://example.com"
                    style={{ color: '#111827' }}
                  />
                </div>

                <div>
                  <label htmlFor="customName" className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="customName"
                    name="customName"
                    value={formData.customName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="my-link"
                    style={{ color: '#111827' }}
                  />
                </div>

                <div>
                  <label htmlFor="validityPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                    Validity Period
                  </label>
                  <select
                    id="validityPeriod"
                    name="validityPeriod"
                    value={formData.validityPeriod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  >
                    <option value="1day">1 Day</option>
                    <option value="7days">7 Days</option>
                    <option value="1month">1 Month</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#C7EF00", color: "#683FC1" }}
                >
                  {loading ? "Shortening..." : "Shorten URL"}
                </button>
              </form>
            </div>
          </div>

          {/* URLs List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Shortened URLs</h2>

              {urlsLoading ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">Loading...</div>
                </div>
              ) : urls.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">No URLs yet</div>
                  <p className="text-gray-500">Create your first shortened URL to get started!</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                  {urls.map((url) => {
                    const validityStatus = getValidityStatus(url.expiryDate)
                    return (
                      <div
                        key={url._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900 break-all">{url.completeShortUrl}</span>
                              <button
                                onClick={() => copyToClipboard(url.completeShortUrl)}
                                className="px-2 py-1 text-xs rounded text-white flex-shrink-0"
                                style={{ backgroundColor: "#683FC1" }}
                              >
                                Copy
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{url.originalUrl}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Created: {new Date(url.createdAt).toLocaleDateString()}</span>
                              <span className={validityStatus.color}>{validityStatus.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && createdUrl && (
        <div className="fixed inset-0  flex items-center justify-center p-4 z-50" style={{backgroundColor:"rgba(0, 0, 0, 0.5)"}}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">URL Created Successfully!</h3>
              <p className="text-gray-600 mb-4">{createdUrl.message}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 break-all">{createdUrl.shortUrl}</span>
                  <button
                    onClick={() => copyToClipboard(createdUrl.shortUrl)}
                    className="ml-2 px-3 py-1 text-xs rounded text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#683FC1" }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                {createdUrl.customName && (
                  <p>Custom Name: <span className="font-medium">{createdUrl.customName}</span></p>
                )}
                <p>Validity: <span className="font-medium">{createdUrl.validityPeriod}</span></p>
                <p>Expires: <span className="font-medium">{new Date(createdUrl.expiryDate).toLocaleDateString()}</span></p>
              </div>

              <button
                onClick={closeModal}
                className="mt-6 w-full py-2 px-4 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: "#683FC1" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
