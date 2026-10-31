import React from 'react';
import { Server, AlertTriangle } from 'lucide-react';
import { useServerStatus } from '../../context/ServerStatusContext';
import Spinner from '../common/Spinner';

const ServerStatusBanner = () => {
  const { isSlowResponse, serverStatus } = useServerStatus();

  if (!isSlowResponse && serverStatus !== 'sleeping') {
    return null;
  }

  return (
    <div className="server-status-banner" role="status" aria-live="polite">
      {isSlowResponse ? (
        <>
          <Spinner size="sm" />
          <span>
            <strong>Connecting to server...</strong> The backend instance may be waking up from free-tier sleep (typically 20–40s). Please wait.
          </span>
        </>
      ) : (
        <>
          <AlertTriangle size={16} />
          <span>Backend service is waking up. Your initial request might take up to 45 seconds.</span>
        </>
      )}
    </div>
  );
};

export default ServerStatusBanner;
