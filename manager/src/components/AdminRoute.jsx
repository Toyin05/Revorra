import { Navigate } from "react-router-dom"

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token")

  if (!token) {
    return <Navigate to="/admin/login" />
  }

  return children
}

export default AdminRoute