import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { HiHome } from 'react-icons/hi2';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-emerald-600">404</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h1>
          <p className="text-gray-500">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
        </div>
        <Link to="/">
          <Button icon={HiHome} size="lg">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
