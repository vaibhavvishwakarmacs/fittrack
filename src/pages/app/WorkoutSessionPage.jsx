import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveWorkoutSession } from '../../components/workouts/LiveWorkoutSession';

export const WorkoutSessionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen">
      <LiveWorkoutSession
        isOpen={true}
        onClose={() => navigate('/app/dashboard')}
        onWorkoutSaved={() => navigate('/app/workouts')}
      />
    </div>
  );
};

export default WorkoutSessionPage;
