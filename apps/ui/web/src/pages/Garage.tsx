import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import Sidebar from '../components/Sidebar';
import { VehicleCard, Vehicle } from '../components/ui/cards/vehiclecard/VehicleCard';
import { CreateVehicleCard } from '../components/ui/cards/createcard/CreateVehicleCard';
import { CardCarousel } from '../components/ui/layouts/cardcarousel/CardCarousel';
import { NewVehicleModal } from '../components/ui/modals/NewVehicleModal';
import { VinLookupResponse } from '../services/agentsApi';

// Mock vehicles data - replace with API call later
const mockVehicles: Vehicle[] = [
  {
    id: '1',
    year: '2023',
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Performance',
    imageUrl:
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=60',
    vin: '5YJ3E1EA5KF123456',
  },
  {
    id: '2',
    year: '2022',
    make: 'BMW',
    model: 'M4',
    trim: 'Competition',
    imageUrl:
      'https://images.unsplash.com/photo-1617531653520-bd466c28f515?w=800&auto=format&fit=crop&q=60',
    vin: 'WBS8M9C51N5L12345',
  },
  {
    id: '3',
    year: '2021',
    make: 'Porsche',
    model: '911',
    trim: 'Carrera S',
    imageUrl:
      'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800&auto=format&fit=crop&q=60',
    vin: 'WP0AB2A99MS123456',
  },
];

export default function Garage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const { isAuthenticated } = useAuth();

  const handleVehicleClick = (vehicle: Vehicle) => {
    // eslint-disable-next-line no-console
    console.log('Vehicle clicked:', vehicle);
    // TODO: Navigate to vehicle details page or open detail modal
  };

  const handleCreateClick = () => {
    setIsNewVehicleModalOpen(true);
  };

  const handleVehicleAdded = (vehicleData: VinLookupResponse) => {
    // Create a new vehicle from the VIN lookup response
    const newVehicle: Vehicle = {
      id: Date.now().toString(), // Temporary ID - replace with API-generated ID
      year: vehicleData.model_year || 'Unknown',
      make: vehicleData.make || 'Unknown',
      model: vehicleData.model || 'Unknown',
      trim: vehicleData.trim,
      vin: vehicleData.vin,
      // TODO: Add imageUrl from API or allow user to upload
    };

    setVehicles(prev => [...prev, newVehicle]);
    // eslint-disable-next-line no-console
    console.log('New vehicle added:', newVehicle);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      {/* Sidebar */}
      {isAuthenticated && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      {/* Top Left Menu Button */}
      {isAuthenticated && (
        <div className='absolute top-6 left-6 z-30'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsSidebarOpen(true)}
            className='hover:bg-white/20 backdrop-blur-sm border border-white/20'
          >
            <Menu className='h-5 w-5' />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className='flex flex-col min-h-screen px-4 sm:px-6 md:px-8 lg:px-12'>
        {/* Header */}
        <div className='flex-shrink-0 text-center pt-20 pb-8'>
          <h1 className='text-5xl md:text-7xl font-bold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent leading-normal pb-2'>
            My Garage
          </h1>
        </div>

        {/* Card Carousel */}
        <div className='flex-1 flex items-center'>
          <CardCarousel className='w-full'>
            {vehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onCardClick={handleVehicleClick} />
            ))}
            <CreateVehicleCard onCreateClick={handleCreateClick} />
          </CardCarousel>
        </div>

        {/* Instructions - Mobile hint */}
        <div className='flex-shrink-0 text-center pb-8'>
          <p className='text-sm text-gray-500'>
            {vehicles.length > 0
              ? 'Swipe to browse your vehicles'
              : 'Get started by adding your first vehicle'}
          </p>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl'></div>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-slate-200/20 to-gray-200/20 rounded-full blur-3xl'></div>
      </div>

      {/* New Vehicle Modal */}
      <NewVehicleModal
        isOpen={isNewVehicleModalOpen}
        onClose={() => setIsNewVehicleModalOpen(false)}
        onVehicleAdded={handleVehicleAdded}
      />
    </div>
  );
}
