import { useAuthRedirect } from '../utils/auth-redirect';

/**
 * Hook for handling authentication actions with proper redirect
 */
export const useAuthWithRedirect = () => {
  const { handleAuthRedirect } = useAuthRedirect();

  const initiateAuth = (returnTo?: string) => {
    handleAuthRedirect(returnTo);
    // This would typically trigger opening the auth modal
    // You can emit an event or use a global state management solution
    const event = new CustomEvent('open-auth-modal');
    window.dispatchEvent(event);
  };

  return { initiateAuth };
};

/**
 * Component to trigger authentication from anywhere
 */
interface AuthTriggerProps {
  children: React.ReactNode;
  returnTo?: string;
  className?: string;
  onClick?: () => void;
}

export const AuthTrigger: React.FC<AuthTriggerProps> = ({ 
  children, 
  returnTo, 
  className = '',
  onClick 
}) => {
  const { initiateAuth } = useAuthWithRedirect();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    initiateAuth(returnTo);
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};
