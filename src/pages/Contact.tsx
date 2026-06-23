import { Navigate, useLocation } from "react-router-dom";

const Contact = () => {
  const { search } = useLocation();
  return <Navigate to={`/about${search}#contact`} replace />;
};

export default Contact;
