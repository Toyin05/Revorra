import { Navigate } from "react-router-dom"

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token")
  console.log('AdminRoute checking token:', token)

  if (!token) {
    return <Navigate to="/admin/login" />
  }

  return children
}

export default AdminRoute