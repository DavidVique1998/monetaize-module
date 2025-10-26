/**
 * Ejemplo de uso del SDK de Retell AI para números de teléfono
 * Basado en la documentación oficial
 */

import { RetellService, ImportPhoneNumberData } from '@/lib/retell';

// Ejemplo de importación de número de teléfono
export async function importPhoneNumberExample() {
  try {
    // Datos del número a importar
    const phoneData: ImportPhoneNumberData = {
      phone_number: '+14157774444',
      termination_uri: 'someuri.pstn.twilio.com',
      sip_trunk_auth_username: 'username',
      sip_trunk_auth_password: '123456',
      inbound_agent_id: 'oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD',
      outbound_agent_id: 'oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD',
      inbound_agent_version: 1,
      outbound_agent_version: 1,
      nickname: 'Frontdesk Number',
      inbound_webhook_url: 'https://example.com/inbound-webhook',
    };

    // Importar el número
    const phoneNumberResponse = await RetellService.importPhoneNumber(phoneData);
    
    console.log('Número importado exitosamente:');
    console.log('ID del agente entrante:', phoneNumberResponse.inbound_agent_id);
    console.log('ID del agente saliente:', phoneNumberResponse.outbound_agent_id);
    console.log('Tipo de número:', phoneNumberResponse.phone_number_type);
    console.log('Número formateado:', phoneNumberResponse.phone_number_pretty);
    
    return phoneNumberResponse;
  } catch (error) {
    console.error('Error al importar número:', error);
    throw error;
  }
}

// Ejemplo de obtener todos los números
export async function getPhoneNumbersExample() {
  try {
    const phoneNumbers = await RetellService.getPhoneNumbers();
    
    console.log(`Se encontraron ${phoneNumbers.length} números de teléfono:`);
    phoneNumbers.forEach((phone, index) => {
      console.log(`${index + 1}. ${phone.phone_number_pretty} (${phone.phone_number_type})`);
    });
    
    return phoneNumbers;
  } catch (error) {
    console.error('Error al obtener números:', error);
    throw error;
  }
}

// Ejemplo de obtener un número específico
export async function getPhoneNumberExample(phoneNumber: string) {
  try {
    const phone = await RetellService.getPhoneNumber(phoneNumber);
    
    console.log('Información del número:');
    console.log('Número:', phone.phone_number_pretty);
    console.log('Tipo:', phone.phone_number_type);
    console.log('Agente entrante:', phone.inbound_agent_id);
    console.log('Agente saliente:', phone.outbound_agent_id);
    console.log('Webhook:', phone.inbound_webhook_url);
    
    return phone;
  } catch (error) {
    console.error('Error al obtener número:', error);
    throw error;
  }
}

// Ejemplo de actualizar un número
export async function updatePhoneNumberExample(phoneNumber: string) {
  try {
    const updateData = {
      nickname: 'Updated Frontdesk Number',
      inbound_webhook_url: 'https://new-webhook.example.com/inbound',
    };

    const updatedPhone = await RetellService.updatePhoneNumber(phoneNumber, updateData);
    
    console.log('Número actualizado exitosamente:');
    console.log('Nuevo nombre:', updatedPhone.nickname);
    console.log('Nuevo webhook:', updatedPhone.inbound_webhook_url);
    
    return updatedPhone;
  } catch (error) {
    console.error('Error al actualizar número:', error);
    throw error;
  }
}

// Ejemplo de eliminar un número
export async function deletePhoneNumberExample(phoneNumber: string) {
  try {
    await RetellService.deletePhoneNumber(phoneNumber);
    console.log(`Número ${phoneNumber} eliminado exitosamente`);
  } catch (error) {
    console.error('Error al eliminar número:', error);
    throw error;
  }
}

// Ejemplo completo de flujo de trabajo
export async function completePhoneNumberWorkflow() {
  try {
    console.log('🚀 Iniciando flujo de trabajo de números de teléfono...\n');

    // 1. Importar un número
    console.log('1. Importando número de teléfono...');
    const importedPhone = await importPhoneNumberExample();
    console.log('✅ Número importado exitosamente\n');

    // 2. Obtener todos los números
    console.log('2. Obteniendo lista de números...');
    const allPhones = await getPhoneNumbersExample();
    console.log('✅ Lista obtenida exitosamente\n');

    // 3. Obtener el número específico
    console.log('3. Obteniendo información del número específico...');
    const specificPhone = await getPhoneNumberExample(importedPhone.phone_number);
    console.log('✅ Información obtenida exitosamente\n');

    // 4. Actualizar el número
    console.log('4. Actualizando configuración del número...');
    const updatedPhone = await updatePhoneNumberExample(importedPhone.phone_number);
    console.log('✅ Número actualizado exitosamente\n');

    // 5. Eliminar el número (opcional)
    console.log('5. Eliminando número de prueba...');
    await deletePhoneNumberExample(importedPhone.phone_number);
    console.log('✅ Número eliminado exitosamente\n');

    console.log('🎉 Flujo de trabajo completado exitosamente!');
  } catch (error) {
    console.error('❌ Error en el flujo de trabajo:', error);
    throw error;
  }
}
