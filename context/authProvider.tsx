import {createContext, ReactNode, useContext, useState} from "react";

type TokenContextType = {
    token: string | null;
    setToken: (token: string | null) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(null);



export  function AuthProvider({children}: {children: ReactNode}) {
    const [token, setToken] = useState<string | null>(null);
    return (
        <TokenContext.Provider value={{ token, setToken }}>
            {children}
        </TokenContext.Provider>
    );

}

export function useToken() {
    const context = useContext(TokenContext);
    if (context === undefined) {
        throw new Error('useToken must be used within a TokenProvider');
    }
    return context;
}