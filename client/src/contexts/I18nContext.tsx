import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types
interface Language {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isActive: boolean;
  isDefault: boolean;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  position: 'before' | 'after';
  isActive: boolean;
  isDefault: boolean;
}

interface ExchangeRate {
  id: number;
  fromCurrencyId: number;
  toCurrencyId: number;
  rate: number;
  updatedAt: string;
}

interface I18nContextType {
  // Current language and currency
  currentLanguage: Language | null;
  currentCurrency: Currency | null;
  
  // Available options
  languages: Language[];
  currencies: Currency[];
  exchangeRates: ExchangeRate[];
  
  // Functions
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number, currencyOverride?: Currency) => string;
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
  
  // Loading state
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Default translations for basic UI elements
const defaultTranslations: Record<string, Record<string, string>> = {
  'es': {
    'home.title': 'SoftwarePar - Desarrollo de Software Profesional',
    'home.subtitle': 'Soluciones tecnológicas personalizadas para tu negocio',
    'nav.home': 'Inicio',
    'nav.about': 'Nosotros',
    'nav.services': 'Servicios',
    'nav.portfolio': 'Portfolio',
    'nav.contact': 'Contacto',
    'nav.login': 'Iniciar Sesión',
    'contact.title': 'Contáctanos',
    'contact.name': 'Nombre completo',
    'contact.email': 'Correo electrónico',
    'contact.phone': 'Teléfono',
    'contact.company': 'Empresa',
    'contact.message': 'Mensaje',
    'contact.send': 'Enviar consulta',
    'footer.rights': 'Todos los derechos reservados',
    'language.spanish': 'Español',
    'language.portuguese': 'Português',
    'language.english': 'English',
    'currency.guaranies': 'Guaraníes',
    'currency.reais': 'Reais',
    'currency.dollars': 'Dólares',
  },
  'pt': {
    'home.title': 'SoftwarePar - Desenvolvimento de Software Profissional',
    'home.subtitle': 'Soluções tecnológicas personalizadas para seu negócio',
    'nav.home': 'Início',
    'nav.about': 'Sobre nós',
    'nav.services': 'Serviços',
    'nav.portfolio': 'Portfólio',
    'nav.contact': 'Contato',
    'nav.login': 'Entrar',
    'contact.title': 'Entre em contato',
    'contact.name': 'Nome completo',
    'contact.email': 'E-mail',
    'contact.phone': 'Telefone',
    'contact.company': 'Empresa',
    'contact.message': 'Mensagem',
    'contact.send': 'Enviar consulta',
    'footer.rights': 'Todos os direitos reservados',
    'language.spanish': 'Español',
    'language.portuguese': 'Português',
    'language.english': 'English',
    'currency.guaranies': 'Guaranis',
    'currency.reais': 'Reais',
    'currency.dollars': 'Dólares',
  },
  'en': {
    'home.title': 'SoftwarePar - Professional Software Development',
    'home.subtitle': 'Custom technology solutions for your business',
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.portfolio': 'Portfolio',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'contact.title': 'Contact us',
    'contact.name': 'Full name',
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.company': 'Company',
    'contact.message': 'Message',
    'contact.send': 'Send inquiry',
    'footer.rights': 'All rights reserved',
    'language.spanish': 'Español',
    'language.portuguese': 'Português',
    'language.english': 'English',
    'currency.guaranies': 'Guaranies',
    'currency.reais': 'Reais',
    'currency.dollars': 'Dollars',
  },
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);
  const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(null);

  // Fetch available languages
  const { data: languages = [], isLoading: languagesLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: async (): Promise<Language[]> => {
      const response = await fetch('/api/config/languages');
      if (!response.ok) throw new Error('Failed to fetch languages');
      return response.json();
    },
  });

  // Fetch available currencies
  const { data: currencies = [], isLoading: currenciesLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: async (): Promise<Currency[]> => {
      const response = await fetch('/api/config/currencies');
      if (!response.ok) throw new Error('Failed to fetch currencies');
      return response.json();
    },
  });

  // Fetch exchange rates
  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const response = await fetch('/api/config/exchange-rates');
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      return response.json();
    },
  });

  // Set default language and currency when data is loaded
  useEffect(() => {
    if (languages.length > 0 && !currentLanguage) {
      const defaultLang = languages.find(l => l.isDefault) || languages[0];
      const savedLangCode = localStorage.getItem('preferred-language');
      const selectedLang = savedLangCode 
        ? languages.find(l => l.code === savedLangCode) || defaultLang
        : defaultLang;
      setCurrentLanguage(selectedLang);
    }
  }, [languages, currentLanguage]);

  useEffect(() => {
    if (currencies.length > 0 && !currentCurrency) {
      const defaultCurr = currencies.find(c => c.isDefault) || currencies[0];
      const savedCurrCode = localStorage.getItem('preferred-currency');
      const selectedCurr = savedCurrCode 
        ? currencies.find(c => c.code === savedCurrCode) || defaultCurr
        : defaultCurr;
      setCurrentCurrency(selectedCurr);
    }
  }, [currencies, currentCurrency]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language.code);
  };

  const setCurrency = (currency: Currency) => {
    setCurrentCurrency(currency);
    localStorage.setItem('preferred-currency', currency.code);
  };

  const t = (key: string): string => {
    if (!currentLanguage) return key;
    
    const translations = defaultTranslations[currentLanguage.code] || defaultTranslations['es'];
    return translations[key] || key;
  };

  const formatCurrency = (amount: number, currencyOverride?: Currency): string => {
    const currency = currencyOverride || currentCurrency;
    if (!currency) return amount.toLocaleString();

    const formattedAmount = amount.toLocaleString();
    
    if (currency.position === 'before') {
      return `${currency.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currency.symbol}`;
    }
  };

  const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency.id === toCurrency.id) return amount;
    
    // Find exchange rate
    const rate = exchangeRates.find(r => 
      r.fromCurrencyId === fromCurrency.id && r.toCurrencyId === toCurrency.id
    );
    
    if (rate) {
      return amount * rate.rate;
    }
    
    // Try reverse rate
    const reverseRate = exchangeRates.find(r => 
      r.fromCurrencyId === toCurrency.id && r.toCurrencyId === fromCurrency.id
    );
    
    if (reverseRate) {
      return amount / reverseRate.rate;
    }
    
    return amount; // Return original amount if no rate found
  };

  const isLoading = languagesLoading || currenciesLoading;

  const value: I18nContextType = {
    currentLanguage,
    currentCurrency,
    languages,
    currencies,
    exchangeRates,
    setLanguage,
    setCurrency,
    t,
    formatCurrency,
    convertCurrency,
    isLoading,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};