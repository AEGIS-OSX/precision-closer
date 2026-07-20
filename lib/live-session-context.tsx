'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';

export interface LiveSession {
  id: string;
  status: 'active' | 'waiting' | 'ended';
  title?: string;
  startedAt?: number;
}

interface LiveSessionState {
  sessions: Record<string, LiveSession>;
}

type LiveSessionAction =
  | { type: 'REGISTER'; payload: LiveSession }
  | { type: 'UPDATE'; payload: LiveSession }
  | { type: 'END'; payload: { id: string } };

function reducer(
  state: LiveSessionState,
  action: LiveSessionAction
): LiveSessionState {
  switch (action.type) {
    case 'REGISTER':
    case 'UPDATE':
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [action.payload.id]: action.payload,
        },
      };
    case 'END': {
      const next = { ...state.sessions };
      delete next[action.payload.id];
      return { ...state, sessions: next };
    }
    default:
      return state;
  }
}

interface LiveSessionContextValue {
  sessions: Record<string, LiveSession>;
  registerSession: (session: LiveSession) => void;
  updateSession: (session: LiveSession) => void;
  endSession: (id: string) => void;
  getSession: (id: string) => LiveSession | undefined;
}

const LiveSessionContext = createContext<
  LiveSessionContextValue | undefined
>(undefined);

export function useLiveSession() {
  const ctx = useContext(LiveSessionContext);
  if (!ctx) {
    throw new Error(
      'useLiveSession must be used within a LiveSessionProvider'
    );
  }
  return ctx;
}

export function LiveSessionProvider({
  children,
  initialSessions = {},
}: {
  children: ReactNode;
  initialSessions?: Record<string, LiveSession>;
}) {
  const [state, dispatch] = useReducer(reducer, {
    sessions: initialSessions,
  });

  const registerSession = useCallback(
    (session: LiveSession) => dispatch({ type: 'REGISTER', payload: session }),
    []
  );
  const updateSession = useCallback(
    (session: LiveSession) => dispatch({ type: 'UPDATE', payload: session }),
    []
  );
  const endSession = useCallback(
    (id: string) => dispatch({ type: 'END', payload: { id } }),
    []
  );
  const getSession = useCallback(
    (id: string) => state.sessions[id],
    [state.sessions]
  );

  return (
    <LiveSessionContext.Provider
      value={{
        sessions: state.sessions,
        registerSession,
        updateSession,
        endSession,
        getSession,
      }}
    >
      {children}
    </LiveSessionContext.Provider>
  );
}
