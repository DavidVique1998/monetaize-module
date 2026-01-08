/**
 * Página de GUI - Demostración de componentes UI
 */

'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { Button } from '@/components/ui/button';
import { Alert, AlertWithIcon, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialogWithVariant } from '@/components/ui/alert-dialog';
import { Phone, Plus, Trash2, Edit, RefreshCw, AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function GuiPage() {
  const [alertDialogOpen, setAlertDialogOpen] = useState<{ [key: string]: boolean }>({});
  const [dialogOpen, setDialogOpen] = useState<{ [key: string]: boolean }>({});

  const openAlertDialog = (key: string) => {
    setAlertDialogOpen(prev => ({ ...prev, [key]: true }));
  };

  const closeAlertDialog = (key: string) => {
    setAlertDialogOpen(prev => ({ ...prev, [key]: false }));
  };

  const openDialog = (key: string) => {
    setDialogOpen(prev => ({ ...prev, [key]: true }));
  };

  const closeDialog = (key: string) => {
    setDialogOpen(prev => ({ ...prev, [key]: false }));
  };
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <HeaderBar 
          title="GUI Components" 
          description="Demostración de todos los componentes de interfaz de usuario disponibles" 
        />

        {/* Sección de demostración de botones y variantes */}
        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          <div>
            <h2 className="text-lg font-semibold mb-4">Variantes de Botones</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="default-outline">Default Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="info">Info</Button>
              <Button variant="error">Error</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="light">Light</Button>
              <Button variant="dark">Dark</Button>
              <Button variant="outline-primary">Outline Primary</Button>
              <Button variant="outline-secondary">Outline Secondary</Button>
              <Button variant="outline-success">Outline Success</Button>
              <Button variant="outline-info">Outline Info</Button>
              <Button variant="outline-error">Outline Error</Button>
              <Button variant="outline-warning">Outline Warning</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Tamaños de Botones</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Variantes con Tamaños</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">Small:</span>
                <Button variant="default" size="sm">Default</Button>
                <Button variant="success" size="sm">Success</Button>
                <Button variant="error" size="sm">Error</Button>
                <Button variant="outline" size="sm">Outline</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">Default:</span>
                <Button variant="default" size="default">Default</Button>
                <Button variant="success" size="default">Success</Button>
                <Button variant="error" size="default">Error</Button>
                <Button variant="outline" size="default">Outline</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">Large:</span>
                <Button variant="default" size="lg">Default</Button>
                <Button variant="success" size="lg">Success</Button>
                <Button variant="error" size="lg">Error</Button>
                <Button variant="outline" size="lg">Outline</Button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Botones con Iconos</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
              <Button variant="success">
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </Button>
              <Button variant="error">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="info">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button variant="warning">
                <AlertCircle className="w-4 h-4 mr-2" />
                Advertencia
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Estados de Botones</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Normal</Button>
              <Button variant="default" disabled>Disabled</Button>
              <Button variant="default" className="opacity-75">Hover</Button>
            </div>
          </div>

          {/* Sección de Alerts */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4">Alerts - Variantes</h2>
            <div className="space-y-4">
              <AlertWithIcon
                variant="success"
                title="Operación exitosa"
                description="La operación se completó correctamente. Todos los cambios han sido guardados."
                onClose={() => {}}
              />
              <AlertWithIcon
                variant="error"
                title="Error en la operación"
                description="Ocurrió un error al procesar la solicitud. Por favor, intenta nuevamente."
                onClose={() => {}}
              />
              <AlertWithIcon
                variant="warning"
                title="Advertencia"
                description="Esta acción puede tener consecuencias. Por favor, verifica antes de continuar."
                onClose={() => {}}
              />
              <AlertWithIcon
                variant="info"
                title="Información"
                description="Esta es una notificación informativa. Puedes continuar con tu trabajo."
                onClose={() => {}}
              />
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Alert por defecto</AlertTitle>
                <AlertDescription>
                  Este es un alert sin variante específica, usando el estilo por defecto.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Sección de Alerts sin iconos */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Alerts - Sin Iconos</h2>
            <div className="space-y-4">
              <Alert variant="success">
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>
                  Este alert no muestra icono automático.
                </AlertDescription>
              </Alert>
              <Alert variant="error">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Este alert no muestra icono automático.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Sección de Alert Dialogs */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4">Alert Dialogs - Modales de Confirmación</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="success" onClick={() => openAlertDialog('success')}>
                Abrir Dialog de Éxito
              </Button>
              <Button variant="error" onClick={() => openAlertDialog('error')}>
                Abrir Dialog de Error
              </Button>
              <Button variant="warning" onClick={() => openAlertDialog('warning')}>
                Abrir Dialog de Advertencia
              </Button>
              <Button variant="info" onClick={() => openAlertDialog('info')}>
                Abrir Dialog de Información
              </Button>
            </div>

            <AlertDialogWithVariant
              open={alertDialogOpen.success}
              onOpenChange={(open) => closeAlertDialog('success')}
              variant="success"
              title="Operación exitosa"
              description="La operación se completó correctamente. ¿Deseas continuar?"
              actionLabel="Continuar"
              cancelLabel="Cerrar"
              onAction={() => console.log('Acción de éxito ejecutada')}
            />

            <AlertDialogWithVariant
              open={alertDialogOpen.error}
              onOpenChange={(open) => closeAlertDialog('error')}
              variant="error"
              title="Error en la operación"
              description="Ocurrió un error al procesar la solicitud. ¿Deseas intentar nuevamente?"
              actionLabel="Reintentar"
              cancelLabel="Cancelar"
              onAction={() => console.log('Acción de error ejecutada')}
            />

            <AlertDialogWithVariant
              open={alertDialogOpen.warning}
              onOpenChange={(open) => closeAlertDialog('warning')}
              variant="warning"
              title="Confirmar acción"
              description="Esta acción no se puede deshacer. ¿Estás seguro de que deseas continuar?"
              actionLabel="Confirmar"
              cancelLabel="Cancelar"
              onAction={() => console.log('Acción de advertencia ejecutada')}
            />

            <AlertDialogWithVariant
              open={alertDialogOpen.info}
              onOpenChange={(open) => closeAlertDialog('info')}
              variant="info"
              title="Información importante"
              description="Esta es una notificación informativa. ¿Deseas continuar?"
              actionLabel="Entendido"
              cancelLabel="Cerrar"
              onAction={() => console.log('Acción de info ejecutada')}
            />
          </div>

          {/* Sección de Dialogs básicos */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4">Dialogs - Modales Básicos</h2>
            <div className="flex flex-wrap gap-3">
              <Dialog open={dialogOpen.basic} onOpenChange={(open) => open ? openDialog('basic') : closeDialog('basic')}>
                <DialogTrigger asChild>
                  <Button variant="default">Abrir Dialog Básico</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog Básico</DialogTitle>
                    <DialogDescription>
                      Este es un dialog básico sin variantes específicas. Puedes usarlo para cualquier propósito.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => closeDialog('basic')}>Cancelar</Button>
                    <Button variant="default" onClick={() => closeDialog('basic')}>Aceptar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogOpen.custom} onOpenChange={(open) => open ? openDialog('custom') : closeDialog('custom')}>
                <DialogTrigger asChild>
                  <Button variant="secondary">Abrir Dialog Personalizado</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Info className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <DialogTitle>Dialog Personalizado</DialogTitle>
                        <DialogDescription>
                          Este dialog tiene un ancho personalizado y un icono en el header.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      Puedes personalizar el contenido del dialog según tus necesidades.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => closeDialog('custom')}>Cerrar</Button>
                    <Button variant="default" onClick={() => closeDialog('custom')}>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Sección de Sonner Toasts */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4">Sonner Toasts - Notificaciones</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Variantes Básicas</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="success" 
                    onClick={() => toast.success('Operación exitosa', {
                      description: 'La operación se completó correctamente.',
                    })}
                  >
                    Toast Success
                  </Button>
                  <Button 
                    variant="error" 
                    onClick={() => toast.error('Error en la operación', {
                      description: 'Ocurrió un error al procesar la solicitud.',
                    })}
                  >
                    Toast Error
                  </Button>
                  <Button 
                    variant="warning" 
                    onClick={() => toast.warning('Advertencia', {
                      description: 'Esta acción puede tener consecuencias.',
                    })}
                  >
                    Toast Warning
                  </Button>
                  <Button 
                    variant="info" 
                    onClick={() => toast.info('Información', {
                      description: 'Esta es una notificación informativa.',
                    })}
                  >
                    Toast Info
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => toast('Notificación por defecto', {
                      description: 'Este es un toast sin variante específica.',
                    })}
                  >
                    Toast Default
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Toasts con Acciones</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="success" 
                    onClick={() => toast.success('Archivo guardado', {
                      description: 'El archivo se ha guardado correctamente.',
                      action: {
                        label: 'Deshacer',
                        onClick: () => toast.info('Acción deshecha'),
                      },
                    })}
                  >
                    Toast con Acción
                  </Button>
                  <Button 
                    variant="error" 
                    onClick={() => toast.error('Error al eliminar', {
                      description: 'No se pudo eliminar el elemento.',
                      action: {
                        label: 'Reintentar',
                        onClick: () => toast.success('Reintentando...'),
                      },
                      cancel: {
                        label: 'Cancelar',
                        onClick: () => {},
                      },
                    })}
                  >
                    Toast con Acción y Cancelar
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Toasts con Duración Personalizada</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="info" 
                    onClick={() => toast.info('Toast de 2 segundos', {
                      description: 'Este toast desaparecerá en 2 segundos.',
                      duration: 2000,
                    })}
                  >
                    Toast Corto (2s)
                  </Button>
                  <Button 
                    variant="info" 
                    onClick={() => toast.info('Toast de 10 segundos', {
                      description: 'Este toast permanecerá visible por 10 segundos.',
                      duration: 10000,
                    })}
                  >
                    Toast Largo (10s)
                  </Button>
                  <Button 
                    variant="warning" 
                    onClick={() => toast.warning('Toast persistente', {
                      description: 'Este toast no desaparecerá automáticamente.',
                      duration: Infinity,
                    })}
                  >
                    Toast Persistente
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Toasts con Promesas</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="default" 
                    onClick={() => {
                      const promise = new Promise((resolve) => {
                        setTimeout(() => resolve({ name: 'Archivo.txt' }), 2000);
                      });

                      toast.promise(promise, {
                        loading: 'Guardando archivo...',
                        success: (data: any) => {
                          return `Archivo ${data.name} guardado correctamente`;
                        },
                        error: 'Error al guardar el archivo',
                      });
                    }}
                  >
                    Toast con Promise (Loading)
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => {
                      const promise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Error de conexión')), 2000);
                      });

                      toast.promise(promise, {
                        loading: 'Cargando datos...',
                        success: 'Datos cargados correctamente',
                        error: (err) => `Error: ${err.message}`,
                      });
                    }}
                  >
                    Toast con Promise (Error)
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Toasts Personalizados</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="default" 
                    onClick={() => toast.custom((t) => (
                      <div className="flex items-center space-x-2 bg-card border border-border rounded-lg p-4 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <div>
                          <p className="font-medium">Toast Personalizado</p>
                          <p className="text-sm text-muted-foreground">Este es un toast completamente personalizado</p>
                        </div>
                        <button
                          onClick={() => toast.dismiss(t)}
                          className="ml-4 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  >
                    Toast Personalizado
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => toast('Toast con JSX', {
                      description: (
                        <div className="flex items-center space-x-2">
                          <Info className="w-4 h-4" />
                          <span>Descripción con elementos JSX</span>
                        </div>
                      ),
                    })}
                  >
                    Toast con JSX
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </DashboardLayout>
  );
}
