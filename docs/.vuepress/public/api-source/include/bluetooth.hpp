#pragma once
#include "sdk.hpp"
#include "bluetooth_uuid.hpp"

namespace desktile::sdk {
// Schema-1 BLE commands over the existing asynchronous platform-request ABI.
// Completion payloads are JSON; radio/GATT results arrive through nextEvent().
class Bluetooth {
    Host host_;
    dt_result submit(JsonWriter &json,dt_request_id &request)const{
        request=0;return json.ok()?host_.platformRequest(json.data(),request):DT_ERR_BUFFER_TOO_SMALL;
    }
    dt_result simple(const char *operation,dt_request_id &request)const{
        char buffer[128];JsonWriter json(buffer,sizeof(buffer));
        json.raw("{\"schema\":1,\"operation\":");json.string(operation);json.raw("}");return submit(json,request);
    }
    dt_result uuidCommand(const char *operation,uint32_t connection,const char *service,const char *characteristic,const char *descriptor,dt_request_id &request)const{
        request=0;if(!connection)return DT_ERR_INVALID_ARGUMENT;
        char buffer[384];JsonWriter json(buffer,sizeof(buffer));json.raw("{\"schema\":1,\"operation\":");json.string(operation);json.raw(",\"connection\":");json.number(connection);
        const char *keys[]{",\"serviceUuid\":",",\"characteristicUuid\":",",\"descriptorUuid\":"};const char *values[]{service,characteristic,descriptor};
        for(unsigned i=0;i<3;++i)if(values[i]){char uuid[37];if(!bluetoothUuid(values[i],uuid))return DT_ERR_INVALID_ARGUMENT;json.raw(keys[i]);json.string(uuid);}
        json.raw("}");return submit(json,request);
    }
    dt_result attributeCommand(bool write,uint32_t connection,uint16_t attribute,const uint8_t *data,size_t bytes,dt_request_id &request)const{
        request=0;if(!connection||!attribute||bytes>244||(!data&&bytes))return DT_ERR_INVALID_ARGUMENT;
        char buffer[704];JsonWriter json(buffer,sizeof(buffer));
        json.raw("{\"schema\":1,\"operation\":");json.string(write?"bluetooth.write":"bluetooth.read");
        json.raw(",\"connection\":");json.number(connection);json.raw(",\"attribute\":");json.number(attribute);
        if(write){json.raw(",\"data\":\"");constexpr char hex[]="0123456789ABCDEF";
            for(size_t i=0;i<bytes;++i){const char pair[]{hex[data[i]>>4],hex[data[i]&15],0};json.raw(pair);}json.raw("\"");}
        json.raw("}");return submit(json,request);
    }
    dt_result attachment(const char *operation,uint32_t connection,dt_request_id &request)const{
        request=0;if(!connection)return DT_ERR_INVALID_ARGUMENT;
        char buffer[128];JsonWriter json(buffer,sizeof(buffer));json.raw("{\"schema\":1,\"operation\":");json.string(operation);
        json.raw(",\"connection\":");json.number(connection);json.raw("}");return submit(json,request);
    }
public:
    dt_result attach(uint32_t connection,dt_request_id &request)const{return attachment("bluetooth.attach",connection,request);}
    dt_result detach(uint32_t connection,dt_request_id &request)const{return attachment("bluetooth.detach",connection,request);}
    enum class PairingAction:uint8_t { Input, Display, Confirm };
    explicit Bluetooth(Host host):host_(host){}
    dt_result status(dt_request_id &request)const{return simple("bluetooth.status",request);}
    dt_result listen(dt_request_id &request)const{return simple("bluetooth.listen",request);}
    dt_result stopScan(dt_request_id &request)const{return simple("bluetooth.stopScan",request);}
    dt_result scan(uint32_t durationMs,bool passive,dt_request_id &request)const{
        request=0;if(durationMs<100||durationMs>60000)return DT_ERR_INVALID_ARGUMENT;
        char buffer[160];JsonWriter json(buffer,sizeof(buffer));json.raw("{\"schema\":1,\"operation\":\"bluetooth.scan\",\"durationMs\":");
        json.number(durationMs);json.raw(",\"passive\":");json.boolean(passive);json.raw("}");return submit(json,request);
    }
    dt_result connect(const char *address,uint8_t addressType,dt_request_id &request)const{
        request=0;if(!address||strlen(address)!=17||addressType>1)return DT_ERR_INVALID_ARGUMENT;
        for(unsigned i=0;i<17;++i){const char c=address[i];if(i%3==2?c!=':':!((c>='0'&&c<='9')||(c>='a'&&c<='f')||(c>='A'&&c<='F')))return DT_ERR_INVALID_ARGUMENT;}
        char buffer[160];JsonWriter json(buffer,sizeof(buffer));json.raw("{\"schema\":1,\"operation\":\"bluetooth.connect\",\"address\":");
        json.string(address);json.raw(",\"addressType\":");json.number(addressType);json.raw("}");return submit(json,request);
    }
    dt_result disconnect(uint32_t connection,dt_request_id &request)const{
        request=0;if(!connection)return DT_ERR_INVALID_ARGUMENT;
        char buffer[128];JsonWriter json(buffer,sizeof(buffer));json.raw("{\"schema\":1,\"operation\":\"bluetooth.disconnect\",\"connection\":");
        json.number(connection);json.raw("}");return submit(json,request);
    }
    dt_result read(uint32_t connection,uint16_t attribute,dt_request_id &request)const{return attributeCommand(false,connection,attribute,nullptr,0,request);}
    dt_result discoverServices(uint32_t connection,const char *uuid,dt_request_id &request)const{return uuidCommand("bluetooth.discoverServices",connection,uuid,nullptr,nullptr,request);}
    dt_result discoverCharacteristics(uint32_t connection,const char *service,const char *uuid,dt_request_id &request)const{if(!service){request=0;return DT_ERR_INVALID_ARGUMENT;}return uuidCommand("bluetooth.discoverCharacteristics",connection,service,uuid,nullptr,request);}
    dt_result discoverDescriptors(uint32_t connection,const char *service,const char *characteristic,const char *uuid,dt_request_id &request)const{if(!service||!characteristic){request=0;return DT_ERR_INVALID_ARGUMENT;}return uuidCommand("bluetooth.discoverDescriptors",connection,service,characteristic,uuid,request);}
    dt_result readUuid(uint32_t connection,const char *service,const char *characteristic,dt_request_id &request)const{if(!service||!characteristic){request=0;return DT_ERR_INVALID_ARGUMENT;}return uuidCommand("bluetooth.readUuid",connection,service,characteristic,nullptr,request);}
    dt_result subscribe(uint32_t connection,const char *service,const char *characteristic,dt_request_id &request)const{if(!service||!characteristic){request=0;return DT_ERR_INVALID_ARGUMENT;}return uuidCommand("bluetooth.subscribe",connection,service,characteristic,nullptr,request);}
    dt_result unsubscribe(uint32_t connection,const char *service,const char *characteristic,dt_request_id &request)const{if(!service||!characteristic){request=0;return DT_ERR_INVALID_ARGUMENT;}return uuidCommand("bluetooth.unsubscribe",connection,service,characteristic,nullptr,request);}
    dt_result pair(uint32_t connection,dt_request_id &request)const{
        request=0;if(!connection)return DT_ERR_INVALID_ARGUMENT;
        char buffer[128];JsonWriter json(buffer,sizeof(buffer));json.raw("{\"schema\":1,\"operation\":\"bluetooth.pair\",\"connection\":");
        json.number(connection);json.raw("}");return submit(json,request);
    }
    dt_result pairingReply(uint32_t connection,PairingAction action,uint32_t prompt,uint32_t passkey,bool accept,dt_request_id &request)const{
        request=0;if(!connection||!prompt||passkey>999999||unsigned(action)>unsigned(PairingAction::Confirm))return DT_ERR_INVALID_ARGUMENT;
        const char *names[]{"input","display","confirm"};char buffer[256];JsonWriter json(buffer,sizeof(buffer));
        json.raw("{\"schema\":1,\"operation\":\"bluetooth.pairingReply\",\"connection\":");json.number(connection);
        json.raw(",\"action\":");json.string(names[unsigned(action)]);json.raw(",\"prompt\":");json.number(prompt);
        json.raw(",\"passkey\":");json.number(passkey);json.raw(",\"accept\":");json.boolean(accept);json.raw("}");return submit(json,request);
    }
    dt_result write(uint32_t connection,uint16_t attribute,const uint8_t *data,size_t bytes,dt_request_id &request)const{return attributeCommand(true,connection,attribute,data,bytes,request);}
    dt_result nextEvent(uint32_t timeoutMs,dt_request_id &request)const{
        request=0;if(timeoutMs>30000)return DT_ERR_INVALID_ARGUMENT;
        char buffer[128];JsonWriter json(buffer,sizeof(buffer));json.raw("{\"schema\":1,\"operation\":\"bluetooth.nextEvent\",\"timeoutMs\":");
        json.number(timeoutMs);json.raw("}");return submit(json,request);
    }
};
} // namespace desktile::sdk
