# VeciLomas Backend Server & Database Layer

Módulo backend diseñado con arquitectura limpia por capas (Clean Architecture / Repository Pattern) para PostgreSQL sobre el esquema `vecilomas`.

## Estructura del Módulo

```
Server/
├── config/
│   └── db.ts                   # Pool PostgreSQL, healthcheck y transacciones ACID
├── types/
│   └── db.types.ts             # Modelos tipados y DTOs
├── repositories/
│   ├── hoa.repository.ts       # Consultas optimizadas con JSON_AGG para directorio
│   ├── amenities.repository.ts # Reservaciones con exclusión GiST anti-traslapes
│   ├── access.repository.ts    # Búsqueda instantánea de QR y bitácora
│   ├── finance.repository.ts   # Transacciones atómicas de pagos y tickets
│   └── audit.repository.ts     # Registro de auditoría
├── controllers/                # Controladores Express tipados
├── routes/                     # Enrutador modular de endpoints REST
├── sql/
│   ├── 01_schema.sql           # DDL completo de tablas, tipos e índices
│   ├── 02_triggers.sql         # Disparadores de auditoría y expiración
│   └── 03_seed.sql             # Datos de prueba idénticos al frontend
├── index.ts                    # Entrypoint Express con logs, CORS y Graceful Shutdown
└── .env.example                # Variables de entorno
```

## Optimizaciones Implementadas (Senior Best Practices)

1. **Anti-N+1 Queries:** Consultas como el directorio residencial (`getResidentsDirectory`) usan `JSON_AGG` para obtener residentes y sus listas de vehículos en una sola ida a la base de datos.
2. **Prevención de Doble Reservación:** Uso de rangos temporales (`tstzrange`) e índices GiST para garantizar que dos residentes no puedan apartar la misma amenidad en el mismo horario.
3. **Transacciones ACID:** Los pagos y check-ins se ejecutan dentro del helper `withTransaction()` asegurando consistencia total.
4. **Seguridad:** Consultas 100% parametrizadas (`$1, $2...`) para prevenir inyecciones SQL.
5. **Transición sin fricción:** El cliente `src/services/apiClient.ts` replica exactamente las funciones del `DataContext.tsx` actual.
