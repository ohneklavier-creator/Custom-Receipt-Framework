import { Routes, Route, Link } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Recibos
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Lista
              </Link>
              <Link
                to="/create"
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Nuevo Recibo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<ReceiptList />} />
          <Route path="/create" element={<CreateReceipt />} />
          <Route path="/receipt/:id" element={<ReceiptDetail />} />
        </Routes>
      </main>
    </div>
  )
}

// Placeholder components - will be moved to pages/ folder
function ReceiptList() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Recibos Recientes</h1>
      <p className="text-gray-500">Lista de recibos aparecerá aquí...</p>
    </div>
  )
}

function CreateReceipt() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Nuevo Recibo</h1>
      <p className="text-gray-500">Formulario de recibo aparecerá aquí...</p>
    </div>
  )
}

function ReceiptDetail() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Detalle de Recibo</h1>
      <p className="text-gray-500">Detalles del recibo aparecerán aquí...</p>
    </div>
  )
}

export default App
