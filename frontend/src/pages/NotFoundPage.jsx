import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <section className="page">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Back to home</Link>
    </section>
  );
};

export default NotFoundPage;
