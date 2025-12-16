'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, AlertCircle, CheckCircle2, Lock, X } from 'lucide-react';
import { 
  useStripe, 
  useElements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement 
} from '@stripe/react-stripe-js';
import { StripeProviderWrapper } from './StripeProviderWrapper';
import { Spinner } from '@/components/ui/spinner';

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
  isDefault: boolean;
}

interface PaymentMethodManagerProps {
  onPaymentMethodSaved?: (paymentMethod: PaymentMethod) => void;
  onPaymentMethodRemoved?: () => void;
}

// Componente interno que usa los hooks de Stripe
function PaymentMethodManagerInner({ 
  onPaymentMethodSaved, 
  onPaymentMethodRemoved 
}: PaymentMethodManagerProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardName, setCardName] = useState('');

  // Opciones de estilo para los elementos de Stripe
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '14px',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet/payment-methods');
      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaymentMethod = async () => {
    if (!stripe || !elements) {
      setError('Stripe no está cargado. Por favor espera un momento e intenta de nuevo.');
      return;
    }

    if (!cardName.trim()) {
      setError('Por favor ingresa el nombre en la tarjeta');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      setError('Error cargando el formulario de tarjeta. Por favor recarga la página.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Crear Setup Intent
      const setupResponse = await fetch('/api/wallet/payment-methods/setup', {
        method: 'POST',
      });

      const setupData = await setupResponse.json();

      if (!setupData.success || !setupData.clientSecret) {
        throw new Error(setupData.error || 'Error creando setup intent');
      }

      // Confirmar Setup Intent usando Stripe Elements
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(
        setupData.clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: cardName.trim(),
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Error confirmando tarjeta');
      }

      if (!setupIntent) {
        throw new Error('No se pudo crear el setup intent');
      }

      // Guardar el payment method
      const saveResponse = await fetch('/api/wallet/payment-methods/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setupIntentId: setupIntent.id,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error || 'Error guardando método de pago');
      }

      setSuccess(true);
      setShowAddForm(false);
      setCardName('');

      // Actualizar lista
      await fetchPaymentMethods();

      if (onPaymentMethodSaved && saveData.paymentMethod) {
        onPaymentMethodSaved(saveData.paymentMethod);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving payment method:', err);
      setError(err.message || 'Error guardando método de pago');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/wallet/payment-methods?paymentMethodId=${paymentMethodId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchPaymentMethods();
        if (onPaymentMethodRemoved) {
          onPaymentMethodRemoved();
        }
      } else {
        setError(data.error || 'Error eliminando método de pago');
      }
    } catch (err: any) {
      console.error('Error removing payment method:', err);
      setError(err.message || 'Error eliminando método de pago');
    }
  };

  const formatCardBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      jcb: 'JCB',
      diners: 'Diners Club',
    };
    return brands[brand.toLowerCase()] || brand;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" className="text-foreground/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-2">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Métodos de Pago</h3>
            <p className="text-xs text-muted-foreground">Gestiona tus tarjetas para recarga automática</p>
          </div>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-primary border border-blue-200 rounded-lg hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 bg-redbg-muted/30 border border-red-200 rounded-lg p-2 flex items-start">
          <AlertCircle className="w-4 h-4 text-destructive mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-3 bg-emerald-600/30 border border-emerald-600/20 rounded-lg p-2 flex items-start">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400">Método de pago guardado exitosamente</p>
        </div>
      )}

      {/* Formulario para agregar tarjeta usando Stripe Elements */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Agregar Nueva Tarjeta</h4>
            <button
              onClick={() => {
                setShowAddForm(false);
                setError(null);
                setCardName('');
              }}
              className="text-muted-foreground hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Nombre en la tarjeta
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-bluebg-muted/300 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Número de tarjeta
              </label>
              <div className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-bluebg-muted/300 focus-within:border-primary bg-card">
                <CardNumberElement options={cardElementOptions} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Vencimiento
                </label>
                <div className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-bluebg-muted/300 focus-within:border-primary bg-card">
                  <CardExpiryElement options={cardElementOptions} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">CVC</label>
                <div className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-bluebg-muted/300 focus-within:border-primary bg-card">
                  <CardCvcElement options={cardElementOptions} />
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <p>Tu información está protegida y encriptada. No almacenamos los datos de tu tarjeta.</p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSavePaymentMethod}
                disabled={saving || !stripe}
                className="inline-flex items-center justify-center flex-1 h-8 px-4 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Tarjeta'
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setError(null);
                  setCardName('');
                }}
                className="px-4 py-2 text-sm text-foreground border border-gray-300 rounded-lg hover:bg-graybg-muted/30 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de métodos de pago */}
      {paymentMethods.length === 0 && !showAddForm ? (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No tienes métodos de pago guardados
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {method.card
                      ? `${formatCardBrand(method.card.brand)} •••• ${method.card.last4}`
                      : 'Método de pago'}
                  </p>
                  {method.card && (
                    <p className="text-xs text-muted-foreground">
                      Vence {method.card.expMonth}/{method.card.expYear}
                    </p>
                  )}
                  {method.isDefault && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/10 text-blue-700 rounded">
                      Predeterminado
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemovePaymentMethod(method.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Eliminar método de pago"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente wrapper que proporciona Stripe Elements
export function PaymentMethodManager(props: PaymentMethodManagerProps) {
  return (
    <StripeProviderWrapper>
      <PaymentMethodManagerInner {...props} />
    </StripeProviderWrapper>
  );
}
