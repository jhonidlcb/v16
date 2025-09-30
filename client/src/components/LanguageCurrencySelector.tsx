import React, { useState } from 'react';
import { Globe, DollarSign, ChevronDown } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface LanguageCurrencySelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

// URLs de las banderas
const FLAG_URLS = {
  'py': '/attached_assets/Flag_of_Paraguay.svg_1759106377911.png',
  'br': '/attached_assets/Flag_of_Brazil.svg_1759106377912.png', 
  'us': '/attached_assets/960px-Flag_of_the_United_States__Pantone_.svg_1759106377911.png'
};

export const LanguageCurrencySelector: React.FC<LanguageCurrencySelectorProps> = ({
  className = '',
  variant = 'default'
}) => {
  const { 
    currentLanguage, 
    currentCurrency, 
    languages, 
    currencies, 
    setLanguage, 
    setCurrency,
    isLoading 
  } = useI18n();

  const [isOpen, setIsOpen] = useState(false);

  // Mapeo de códigos de idioma a banderas
  const getLanguageFlag = (langCode: string) => {
    switch(langCode.toLowerCase()) {
      case 'es': return FLAG_URLS.py; // Español -> Paraguay
      case 'pt': return FLAG_URLS.br; // Português -> Brasil
      case 'en': return FLAG_URLS.us; // English -> USA
      default: return FLAG_URLS.py;
    }
  };

  // Mapeo de códigos de moneda a banderas
  const getCurrencyFlag = (currCode: string) => {
    switch(currCode.toUpperCase()) {
      case 'PYG': return FLAG_URLS.py; // Guaraníes -> Paraguay
      case 'BRL': return FLAG_URLS.br; // Reais -> Brasil
      case 'USD': return FLAG_URLS.us; // Dólares -> USA
      default: return FLAG_URLS.py;
    }
  };

  if (isLoading || !currentLanguage || !currentCurrency) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="animate-pulse bg-gray-300 rounded h-8 w-16"></div>
      </div>
    );
  }

  // Selector ultra compacto con banderas
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Selector de Idioma - Solo bandera */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20">
            <img 
              src={getLanguageFlag(currentLanguage.code)} 
              alt={currentLanguage.name}
              className="w-5 h-5 rounded-sm object-cover"
              onError={(e) => {
                // Fallback si la imagen no carga
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '🌐';
              }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <div className="px-3 py-2 text-sm font-semibold text-gray-600 border-b">
            Idioma / Language
          </div>
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.id}
              onClick={() => setLanguage(lang)}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center">
                <img 
                  src={getLanguageFlag(lang.code)} 
                  alt={lang.name}
                  className="w-6 h-4 rounded-sm object-cover mr-3"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{lang.code}</div>
                </div>
              </div>
              {lang.id === currentLanguage.id && (
                <Badge variant="default" className="ml-2 text-xs">
                  ✓
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selector de Moneda - Solo símbolo */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-white/20 min-w-0">
            <span className="text-sm font-bold">{currentCurrency.symbol}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <div className="px-3 py-2 text-sm font-semibold text-gray-600 border-b">
            Moneda / Currency
          </div>
          {currencies.map((currency) => (
            <DropdownMenuItem
              key={currency.id}
              onClick={() => setCurrency(currency)}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center">
                <img 
                  src={getCurrencyFlag(currency.code)} 
                  alt={currency.name}
                  className="w-6 h-4 rounded-sm object-cover mr-3"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <div className="font-medium">{currency.name}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="font-bold mr-1">{currency.symbol}</span>
                    <span className="uppercase">{currency.code}</span>
                  </div>
                </div>
              </div>
              {currency.id === currentCurrency.id && (
                <Badge variant="default" className="ml-2 text-xs">
                  ✓
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};