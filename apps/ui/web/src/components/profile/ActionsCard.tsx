import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Activity, Download, Trash2 } from 'lucide-react';

type ActionsCardProps = {
  onExport: () => void;
  onRequestDeleteAccount: () => void;
};

const ActionsCard: React.FC<ActionsCardProps> = ({ onExport, onRequestDeleteAccount }) => {
  return (
    <Card className='mb-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <Activity className='h-6 w-6 text-purple-500' />
          <div>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Additional account management options</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Button variant='outline' onClick={onExport} className='flex items-center gap-2'>
            <Download className='h-4 w-4' />
            Export Profile Data
          </Button>
          <Button
            variant='outline'
            onClick={onRequestDeleteAccount}
            className='flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50'
          >
            <Trash2 className='h-4 w-4' />
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionsCard;
