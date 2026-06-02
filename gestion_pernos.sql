--
-- PostgreSQL database dump
--

\restrict VOLIHJhc5MZMWeY3PPRcqB7jfqtkxywkskhskFv9SkK2bHesNPpPhfyWdfjwB67

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.2

-- Started on 2026-06-02 08:47:20

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 885 (class 1247 OID 16397)
-- Name: tipo_movimiento_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_movimiento_enum AS ENUM (
    'ENTRADA',
    'SALIDA'
);


ALTER TYPE public.tipo_movimiento_enum OWNER TO postgres;

--
-- TOC entry 252 (class 1255 OID 25042)
-- Name: fn_automatizar_kardex_cancelacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_automatizar_kardex_cancelacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    r_detalle RECORD;
BEGIN
    -- Si el estado cambia de 1 (Procesada) a 0 (Cancelada)
    IF (OLD.estado = 1 AND NEW.estado = 0) THEN
        FOR r_detalle IN SELECT id_producto, cantidad FROM public.detalles_ventas WHERE id_venta = NEW.id LOOP
            INSERT INTO public.inventario (id_producto, tipo_movimiento, cantidad, fecha)
            VALUES (r_detalle.id_producto, 'ENTRADA', r_detalle.cantidad, CURRENT_TIMESTAMP);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_automatizar_kardex_cancelacion() OWNER TO postgres;

--
-- TOC entry 251 (class 1255 OID 25040)
-- Name: fn_automatizar_kardex_venta(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_automatizar_kardex_venta() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Si es una nueva venta (inserción en detalles_ventas), genera SALIDA de inventario
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.inventario (id_producto, tipo_movimiento, cantidad, fecha)
        VALUES (NEW.id_producto, 'SALIDA', NEW.cantidad, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_automatizar_kardex_venta() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 231 (class 1259 OID 16480)
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    estado integer DEFAULT 1
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16479)
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_seq OWNER TO postgres;

--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 230
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- TOC entry 227 (class 1259 OID 16456)
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id bigint NOT NULL,
    dni_ruc character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(255),
    dni character varying(20),
    email character varying(100),
    telefono character varying(20),
    estado integer NOT NULL
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16455)
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO postgres;

--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 226
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- TOC entry 243 (class 1259 OID 16579)
-- Name: cuentas_cobrar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuentas_cobrar (
    id integer NOT NULL,
    id_cliente bigint,
    id_venta bigint,
    saldo_pendiente numeric(10,2),
    estado character varying(20)
);


ALTER TABLE public.cuentas_cobrar OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16578)
-- Name: cuentas_cobrar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cuentas_cobrar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cuentas_cobrar_id_seq OWNER TO postgres;

--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 242
-- Name: cuentas_cobrar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cuentas_cobrar_id_seq OWNED BY public.cuentas_cobrar.id;


--
-- TOC entry 245 (class 1259 OID 16597)
-- Name: cuentas_pagar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuentas_pagar (
    id integer NOT NULL,
    id_proveedor bigint,
    monto_total numeric(10,2),
    saldo_pendiente numeric(10,2),
    estado character varying(20)
);


ALTER TABLE public.cuentas_pagar OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16596)
-- Name: cuentas_pagar_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cuentas_pagar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cuentas_pagar_id_seq OWNER TO postgres;

--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 244
-- Name: cuentas_pagar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cuentas_pagar_id_seq OWNED BY public.cuentas_pagar.id;


--
-- TOC entry 250 (class 1259 OID 25063)
-- Name: detalles_pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_pedidos (
    id bigint NOT NULL,
    id_pedido bigint NOT NULL,
    id_producto bigint NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE public.detalles_pedidos OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 25062)
-- Name: detalles_pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalles_pedidos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalles_pedidos_id_seq OWNER TO postgres;

--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 249
-- Name: detalles_pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalles_pedidos_id_seq OWNED BY public.detalles_pedidos.id;


--
-- TOC entry 235 (class 1259 OID 16510)
-- Name: detalles_tecnicos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_tecnicos (
    id integer NOT NULL,
    id_producto bigint,
    tipo_rosca character varying(50),
    tipo_cabeza character varying(50),
    longitud character varying(50)
);


ALTER TABLE public.detalles_tecnicos OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16509)
-- Name: detalles_tecnicos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalles_tecnicos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalles_tecnicos_id_seq OWNER TO postgres;

--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 234
-- Name: detalles_tecnicos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalles_tecnicos_id_seq OWNED BY public.detalles_tecnicos.id;


--
-- TOC entry 239 (class 1259 OID 16543)
-- Name: detalles_ventas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_ventas (
    id bigint NOT NULL,
    id_venta bigint NOT NULL,
    id_producto bigint NOT NULL,
    cantidad integer NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    descuento numeric(10,2) DEFAULT 0.00 NOT NULL,
    subtotal numeric(10,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.detalles_ventas OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16542)
-- Name: detalles_ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalles_ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalles_ventas_id_seq OWNER TO postgres;

--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 238
-- Name: detalles_ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalles_ventas_id_seq OWNED BY public.detalles_ventas.id;


--
-- TOC entry 241 (class 1259 OID 16563)
-- Name: inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventario (
    id integer NOT NULL,
    id_producto bigint,
    tipo_movimiento public.tipo_movimiento_enum NOT NULL,
    cantidad integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventario OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16562)
-- Name: inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventario_id_seq OWNER TO postgres;

--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 240
-- Name: inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventario_id_seq OWNED BY public.inventario.id;


--
-- TOC entry 222 (class 1259 OID 16412)
-- Name: opciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opciones (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    ruta character varying(100),
    icono character varying(50)
);


ALTER TABLE public.opciones OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16411)
-- Name: opciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opciones_id_seq OWNER TO postgres;

--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 221
-- Name: opciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opciones_id_seq OWNED BY public.opciones.id;


--
-- TOC entry 248 (class 1259 OID 25045)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id bigint NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_cliente bigint NOT NULL,
    total numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 25044)
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_id_seq OWNER TO postgres;

--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 247
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- TOC entry 246 (class 1259 OID 16622)
-- Name: perfil_opcion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.perfil_opcion (
    id_perfil bigint NOT NULL,
    id_opcion bigint NOT NULL
);


ALTER TABLE public.perfil_opcion OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16402)
-- Name: perfiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.perfiles (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion character varying(255),
    estado integer DEFAULT 1
);


ALTER TABLE public.perfiles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16401)
-- Name: perfiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.perfiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.perfiles_id_seq OWNER TO postgres;

--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 219
-- Name: perfiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.perfiles_id_seq OWNED BY public.perfiles.id;


--
-- TOC entry 223 (class 1259 OID 16420)
-- Name: perfiles_opciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.perfiles_opciones (
    id_perfil integer NOT NULL,
    id_opcion integer NOT NULL
);


ALTER TABLE public.perfiles_opciones OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16489)
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    id_categoria bigint,
    id_proveedor bigint,
    precio numeric(10,2) NOT NULL,
    stock integer DEFAULT 0,
    descripcion text,
    estado integer DEFAULT 1,
    fecha_registro timestamp(6) without time zone,
    imagen character varying(255),
    precio_compra numeric(10,2),
    precio_venta numeric(10,2) NOT NULL,
    stock_minimo integer DEFAULT 0
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16488)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 232
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 229 (class 1259 OID 16468)
-- Name: proveedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedores (
    id bigint NOT NULL,
    ruc character varying(20) NOT NULL,
    nombre character varying(150) NOT NULL,
    correo character varying(100),
    direccion character varying(255),
    estado integer DEFAULT 1,
    telefono character varying(50),
    documento character varying(20)
);


ALTER TABLE public.proveedores OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16467)
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proveedores_id_seq OWNER TO postgres;

--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 228
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- TOC entry 225 (class 1259 OID 16438)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    usuario character varying(50) NOT NULL,
    clave character varying(255) NOT NULL,
    id_perfil bigint,
    correo character varying(255) NOT NULL,
    estado integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16437)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 224
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 237 (class 1259 OID 16523)
-- Name: ventas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ventas (
    id bigint NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_usuario bigint NOT NULL,
    id_cliente bigint NOT NULL,
    total numeric(10,2) NOT NULL,
    estado integer DEFAULT 1 NOT NULL,
    tipo_comprobante character varying(20) DEFAULT 'BOLETA'::character varying NOT NULL,
    serie character varying(10) DEFAULT 'B001'::character varying NOT NULL,
    numero_comprobante character varying(20) DEFAULT '00000001'::character varying NOT NULL,
    subtotal numeric(10,2) DEFAULT 0.00 NOT NULL,
    igv numeric(10,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.ventas OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16522)
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ventas_id_seq OWNER TO postgres;

--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 236
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;


--
-- TOC entry 4947 (class 2604 OID 16717)
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- TOC entry 4944 (class 2604 OID 24884)
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- TOC entry 4967 (class 2604 OID 16582)
-- Name: cuentas_cobrar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas_cobrar ALTER COLUMN id SET DEFAULT nextval('public.cuentas_cobrar_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 16600)
-- Name: cuentas_pagar id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas_pagar ALTER COLUMN id SET DEFAULT nextval('public.cuentas_pagar_id_seq'::regclass);


--
-- TOC entry 4972 (class 2604 OID 25066)
-- Name: detalles_pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_pedidos ALTER COLUMN id SET DEFAULT nextval('public.detalles_pedidos_id_seq'::regclass);


--
-- TOC entry 4953 (class 2604 OID 16513)
-- Name: detalles_tecnicos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_tecnicos ALTER COLUMN id SET DEFAULT nextval('public.detalles_tecnicos_id_seq'::regclass);


--
-- TOC entry 4962 (class 2604 OID 24905)
-- Name: detalles_ventas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_ventas ALTER COLUMN id SET DEFAULT nextval('public.detalles_ventas_id_seq'::regclass);


--
-- TOC entry 4965 (class 2604 OID 16566)
-- Name: inventario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario ALTER COLUMN id SET DEFAULT nextval('public.inventario_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 16609)
-- Name: opciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opciones ALTER COLUMN id SET DEFAULT nextval('public.opciones_id_seq'::regclass);


--
-- TOC entry 4969 (class 2604 OID 25048)
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- TOC entry 4939 (class 2604 OID 16629)
-- Name: perfiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfiles ALTER COLUMN id SET DEFAULT nextval('public.perfiles_id_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 16692)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4945 (class 2604 OID 16757)
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- TOC entry 4942 (class 2604 OID 16647)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4954 (class 2604 OID 24931)
-- Name: ventas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas ALTER COLUMN id SET DEFAULT nextval('public.ventas_id_seq'::regclass);


--
-- TOC entry 5208 (class 0 OID 16480)
-- Dependencies: 231
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, nombre, descripcion, estado) FROM stdin;
1	Alicates	Alicates de presión, corte, universal y especialistas	1
2	Lubricantes	Aceites multiusos, aflojatodo y para motores	1
3	Aplicadores	Pistolas y aplicadores para silicona y calafateo	1
4	Automotriz	Herramientas especializadas para mecánica automotriz	1
5	Soldadura	Porta electrodos y accesorios para soldar	1
6	Medición	Flexómetros, niveles y cintas métricas	1
7	Llaves y Dados	Llaves combinadas, españolas, juegos de dados y matracas	1
8	Corte y Desbaste	Arcos de sierra, hojas de sierra, limas y cutters	1
9	Fijación y Remachado	Remachadoras manuales y remaches	1
10	Golpe y Fuerza	Martillos, combas, barretas y cinceles	1
11	Pintura y Acabados	Brochas, pinceles y rodillos	1
12	Destornilladores y Puntas	Destornilladores de pala, phillips y juegos de puntas	1
13	Equipamiento de Taller	Torquímetros, extractores y prensas	1
\.


--
-- TOC entry 5204 (class 0 OID 16456)
-- Dependencies: 227
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, dni_ruc, nombre, direccion, dni, email, telefono, estado) FROM stdin;
1	71077968	Luz	mi casa	\N	luz@gmail.com	987456321	1
\.


--
-- TOC entry 5220 (class 0 OID 16579)
-- Dependencies: 243
-- Data for Name: cuentas_cobrar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuentas_cobrar (id, id_cliente, id_venta, saldo_pendiente, estado) FROM stdin;
\.


--
-- TOC entry 5222 (class 0 OID 16597)
-- Dependencies: 245
-- Data for Name: cuentas_pagar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuentas_pagar (id, id_proveedor, monto_total, saldo_pendiente, estado) FROM stdin;
\.


--
-- TOC entry 5227 (class 0 OID 25063)
-- Dependencies: 250
-- Data for Name: detalles_pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalles_pedidos (id, id_pedido, id_producto, cantidad, precio_unitario, subtotal) FROM stdin;
1	1	6	1	8.90	8.90
2	2	8	1	7.16	7.16
3	2	6	1	8.90	8.90
4	2	10	1	31.78	31.78
5	2	12	1	42.50	42.50
6	2	13	1	19.80	19.80
7	3	7	3	10.17	30.51
8	3	5	1	15.97	15.97
9	3	6	1	8.90	8.90
10	4	12	1	42.50	42.50
11	4	13	1	19.80	19.80
12	4	14	1	11.25	11.25
\.


--
-- TOC entry 5212 (class 0 OID 16510)
-- Dependencies: 235
-- Data for Name: detalles_tecnicos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalles_tecnicos (id, id_producto, tipo_rosca, tipo_cabeza, longitud) FROM stdin;
\.


--
-- TOC entry 5216 (class 0 OID 16543)
-- Dependencies: 239
-- Data for Name: detalles_ventas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalles_ventas (id, id_venta, id_producto, cantidad, precio_venta, descuento, subtotal) FROM stdin;
1	1	5	1	15.97	0.00	15.97
2	1	7	1	10.17	0.00	10.17
3	2	1	1	26.69	0.00	26.69
4	2	9	1	12.75	0.00	12.75
5	3	12	1	42.50	0.00	42.50
6	3	13	1	19.80	0.00	19.80
7	3	14	1	11.25	0.00	11.25
\.


--
-- TOC entry 5218 (class 0 OID 16563)
-- Dependencies: 241
-- Data for Name: inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventario (id, id_producto, tipo_movimiento, cantidad, fecha) FROM stdin;
1	12	SALIDA	1	2026-05-29 09:34:06.11338
2	13	SALIDA	1	2026-05-29 09:34:06.11338
3	14	SALIDA	1	2026-05-29 09:34:06.11338
\.


--
-- TOC entry 5199 (class 0 OID 16412)
-- Dependencies: 222
-- Data for Name: opciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opciones (id, nombre, ruta, icono) FROM stdin;
1	Dashboard	/dashboard	bi-house-door-fill
2	Usuarios	/usuarios/listar	bi-people-fill
3	Perfiles	/perfiles/listar	bi-person-vcard-fill
4	Productos	/productos/listar	bi-box-fill
5	Categorías	/categorias/listar	bi-tag-fill
6	Proveedores	#	bi-truck
7	Clientes	#	bi-person-badge-fill
8	Ventas	#	bi-cart-fill
9	Inventario	#	bi-archive-fill
\.


--
-- TOC entry 5225 (class 0 OID 25045)
-- Dependencies: 248
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, fecha, id_cliente, total, estado) FROM stdin;
1	2026-05-26 09:56:57.278906	1	8.90	PENDIENTE
2	2026-05-26 09:57:42.365026	1	110.14	PENDIENTE
3	2026-05-29 09:29:55.854178	1	55.38	PENDIENTE
4	2026-05-29 09:33:52.421499	1	73.55	COMPLETADO
\.


--
-- TOC entry 5223 (class 0 OID 16622)
-- Dependencies: 246
-- Data for Name: perfil_opcion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.perfil_opcion (id_perfil, id_opcion) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
4	1
4	6
\.


--
-- TOC entry 5197 (class 0 OID 16402)
-- Dependencies: 220
-- Data for Name: perfiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.perfiles (id, nombre, descripcion, estado) FROM stdin;
2	VENDEDOR	Acceso a ventas, catálogo y consultas de stock	1
3	ALMACENERO	Gestión de inventarios, entradas y salidas de productos	1
4	CAJERO	Relación con cuentas a pagar y cobrar	1
1	ADMINISTRADOR	Acceso total al sistema y gestión de usuarios	1
\.


--
-- TOC entry 5200 (class 0 OID 16420)
-- Dependencies: 223
-- Data for Name: perfiles_opciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.perfiles_opciones (id_perfil, id_opcion) FROM stdin;
\.


--
-- TOC entry 5210 (class 0 OID 16489)
-- Dependencies: 233
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, nombre, id_categoria, id_proveedor, precio, stock, descripcion, estado, fecha_registro, imagen, precio_compra, precio_venta, stock_minimo) FROM stdin;
15	Matraca reversible 1/2" (13554)	7	1	41.60	15	Clave: M-549, Mango moleteado	1	2026-05-13 10:00:00	\N	32.00	41.60	3
5	Aceite semi-sintético 4 tiempos (14929)	2	1	15.97	49	Clave: ACES-4T-32, Contenido 1L	1	2026-05-13 10:00:00	/images/products/4dc1e8b0-66df-4b0f-8ac9-6419b0fe6721_f70d6f0e9cc7d-2-1024x1024.png	12.50	15.97	10
6	Aceite sintético 2 tiempos (17625)	2	1	8.90	40	Clave: ACES-20, Contenido 400ml	1	2026-05-13 10:00:00	/images/products/7a02f215-006b-443a-a652-b8cdff80dbf7_D_Q_NP_705147-MLA79832932231_102024-.png	6.80	8.90	10
7	Aceite aflojatodo Truper (13472)	2	1	10.17	99	Clave: WT-550, Contenido 550ml	1	2026-05-13 10:00:00	/images/products/ddfc0d74-f07d-4ecc-a288-dec87779f794_imageUrl_1.png	8.50	10.17	20
8	Pistola silicona tipo esqueleto (17550)	3	1	7.16	60	Clave: PICA-E, Marca Truper	1	2026-05-13 10:00:00	/images/products/77f42298-1c0f-4048-a180-c1c78ba03685_D_NQ_NP_792947-MPE89956195863_082025-O.png	5.50	7.16	12
9	Pistola silicona reforzada (101280)	3	1	12.75	44	Clave: PICA-R, Marca Truper	1	2026-05-13 10:00:00	/images/products/5910ec2d-23ad-4ef0-b186-57dd3c58ca64_image-493cadf1379b4169b669c1897e9a15bd.png	10.20	12.75	10
2	Alicate de punta y corte 6" (17334)	1	1	15.68	25	Clave: T203-6X, Comfort Grip Expert	1	2026-05-13 10:00:00	/images/products/1c7636c8-0e97-4800-b470-9a0ac6b6c7ce_images.png	12.50	15.68	5
3	Alicate de corte diagonal 6" (17337)	1	1	15.68	25	Clave: T302-6X, Comfort Grip Expert	1	2026-05-13 10:00:00	/images/products/aacf4c4b-b353-47ea-b116-ca3076d39aba_alicate-de-corte-6-aislado-truper-17331.png	12.80	15.68	5
4	Alicate pelacables 22 a 10 AWG (17357)	1	1	16.00	20	Clave: PE-CA-6, Cortador de tornillos	1	2026-05-13 10:00:00	/images/products/646d3829-e515-4605-a5ea-10c888a83a8e_F_15666.jpg	13.50	16.00	5
1	Alicate universal alta palanca 8" (17330)	1	1	26.69	29	Clave: T200-8X, Comfort Grip Expert	1	2026-05-13 10:00:00	/images/products/341fd6c8-bd30-460d-b719-6ccfa7f1c0f4_alicate-universal-8-truper-17330.webp	22.40	26.69	5
10	Compresor anillos de pistón (14534)	4	1	31.78	15	Clave: CO-RE-10, Apertura máx 5"	1	2026-05-13 10:00:00	/images/products/d7192131-a7f8-42b7-b0d4-1db631fd950c_D_NQ_NP_868614-MPE89427746867_082025-O.png	25.00	31.78	3
11	Extractor de resortes válvulas (14528)	4	1	158.78	10	Clave: CO-RE-VA, Uso rudo	1	2026-05-13 10:00:00	/images/products/a1104e7c-3e8e-4e44-95b0-b57e5a0556d0_compresor-para-resorte-de-valvulas-10-250mm-truper-14528.png	120.00	158.78	2
12	Nivel magnético 24" (17056)	6	1	42.50	19	Clave: NT-24, Cuerpo de aluminio	1	2026-05-13 10:00:00	\N	35.00	42.50	5
13	Flexómetro Gripper 5m (14578)	6	1	19.80	49	Clave: FH-5M, Cinta de 19mm	1	2026-05-13 10:00:00	\N	15.00	19.80	10
14	Llave combinada 1/2" (12815)	7	1	11.25	39	Clave: LL-2016L, Acero al cromo vanadio	1	2026-05-13 10:00:00	\N	8.50	11.25	10
\.


--
-- TOC entry 5206 (class 0 OID 16468)
-- Dependencies: 229
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedores (id, ruc, nombre, correo, direccion, estado, telefono, documento) FROM stdin;
1	20100480301	Truper Servicios S.A.	\N	Av. Los Chancas LT 8, Santa Anita	1	992223332	\N
\.


--
-- TOC entry 5202 (class 0 OID 16438)
-- Dependencies: 225
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, usuario, clave, id_perfil, correo, estado) FROM stdin;
2	Elizabeth Vega	gerente	123456	1	gerente@gmail.com	1
1	Admin Luz	admin	123456	1	luz@gmail.com	1
\.


--
-- TOC entry 5214 (class 0 OID 16523)
-- Dependencies: 237
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ventas (id, fecha, id_usuario, id_cliente, total, estado, tipo_comprobante, serie, numero_comprobante, subtotal, igv) FROM stdin;
1	2026-05-15 09:04:32.22945	1	1	26.14	1	BOLETA	B001	00000001	22.15	3.99
2	2026-05-15 09:15:22.09094	1	1	39.44	1	BOLETA	B001	00000002	33.42	6.02
3	2026-05-29 09:34:06.269656	1	1	73.55	1	BOLETA	B001	00000003	62.33	11.22
\.


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 230
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 13, true);


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 226
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 1, true);


--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 242
-- Name: cuentas_cobrar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cuentas_cobrar_id_seq', 1, false);


--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 244
-- Name: cuentas_pagar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cuentas_pagar_id_seq', 1, false);


--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 249
-- Name: detalles_pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalles_pedidos_id_seq', 12, true);


--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 234
-- Name: detalles_tecnicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalles_tecnicos_id_seq', 1, false);


--
-- TOC entry 5254 (class 0 OID 0)
-- Dependencies: 238
-- Name: detalles_ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalles_ventas_id_seq', 7, true);


--
-- TOC entry 5255 (class 0 OID 0)
-- Dependencies: 240
-- Name: inventario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventario_id_seq', 3, true);


--
-- TOC entry 5256 (class 0 OID 0)
-- Dependencies: 221
-- Name: opciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opciones_id_seq', 9, true);


--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 247
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 4, true);


--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 219
-- Name: perfiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.perfiles_id_seq', 4, true);


--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 232
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 1, false);


--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 228
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 1, false);


--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 224
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 2, true);


--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 236
-- Name: ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ventas_id_seq', 3, true);


--
-- TOC entry 4998 (class 2606 OID 16719)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 4986 (class 2606 OID 16466)
-- Name: clientes clientes_dni_ruc_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_dni_ruc_key UNIQUE (dni_ruc);


--
-- TOC entry 4988 (class 2606 OID 24886)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 5015 (class 2606 OID 16585)
-- Name: cuentas_cobrar cuentas_cobrar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 16603)
-- Name: cuentas_pagar cuentas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas_pagar
    ADD CONSTRAINT cuentas_pagar_pkey PRIMARY KEY (id);


--
-- TOC entry 5025 (class 2606 OID 25074)
-- Name: detalles_pedidos detalles_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_pedidos
    ADD CONSTRAINT detalles_pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 16516)
-- Name: detalles_tecnicos detalles_tecnicos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_tecnicos
    ADD CONSTRAINT detalles_tecnicos_pkey PRIMARY KEY (id);


--
-- TOC entry 5009 (class 2606 OID 24907)
-- Name: detalles_ventas detalles_ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_ventas
    ADD CONSTRAINT detalles_ventas_pkey PRIMARY KEY (id);


--
-- TOC entry 5013 (class 2606 OID 16572)
-- Name: inventario inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (id);


--
-- TOC entry 4976 (class 2606 OID 16611)
-- Name: opciones opciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opciones
    ADD CONSTRAINT opciones_pkey PRIMARY KEY (id);


--
-- TOC entry 5023 (class 2606 OID 25056)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 5019 (class 2606 OID 16628)
-- Name: perfil_opcion perfil_opcion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfil_opcion
    ADD CONSTRAINT perfil_opcion_pkey PRIMARY KEY (id_perfil, id_opcion);


--
-- TOC entry 4978 (class 2606 OID 16426)
-- Name: perfiles_opciones perfiles_opciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfiles_opciones
    ADD CONSTRAINT perfiles_opciones_pkey PRIMARY KEY (id_perfil, id_opcion);


--
-- TOC entry 4974 (class 2606 OID 16631)
-- Name: perfiles perfiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfiles
    ADD CONSTRAINT perfiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5000 (class 2606 OID 16694)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4992 (class 2606 OID 16759)
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 4994 (class 2606 OID 16478)
-- Name: proveedores proveedores_ruc_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_ruc_key UNIQUE (ruc);


--
-- TOC entry 4980 (class 2606 OID 16678)
-- Name: usuarios ukcdmw5hxlfj78uf4997i3qyyw5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT ukcdmw5hxlfj78uf4997i3qyyw5 UNIQUE (correo);


--
-- TOC entry 4996 (class 2606 OID 24883)
-- Name: proveedores ukffj6y49mpe4t7pj6klbksla0t; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT ukffj6y49mpe4t7pj6klbksla0t UNIQUE (documento);


--
-- TOC entry 4990 (class 2606 OID 24970)
-- Name: clientes ukm6ysdwsqke00e5piajbvgn6lg; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT ukm6ysdwsqke00e5piajbvgn6lg UNIQUE (dni);


--
-- TOC entry 4982 (class 2606 OID 16649)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4984 (class 2606 OID 16449)
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- TOC entry 5007 (class 2606 OID 24933)
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- TOC entry 5026 (class 1259 OID 25087)
-- Name: idx_detalles_pedidos_pedido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalles_pedidos_pedido ON public.detalles_pedidos USING btree (id_pedido);


--
-- TOC entry 5027 (class 1259 OID 25088)
-- Name: idx_detalles_pedidos_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalles_pedidos_producto ON public.detalles_pedidos USING btree (id_producto);


--
-- TOC entry 5010 (class 1259 OID 25039)
-- Name: idx_detalles_ventas_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalles_ventas_producto ON public.detalles_ventas USING btree (id_producto);


--
-- TOC entry 5011 (class 1259 OID 25038)
-- Name: idx_detalles_ventas_venta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalles_ventas_venta ON public.detalles_ventas USING btree (id_venta);


--
-- TOC entry 5020 (class 1259 OID 25085)
-- Name: idx_pedidos_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedidos_cliente ON public.pedidos USING btree (id_cliente);


--
-- TOC entry 5021 (class 1259 OID 25086)
-- Name: idx_pedidos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedidos_fecha ON public.pedidos USING btree (fecha);


--
-- TOC entry 5003 (class 1259 OID 25036)
-- Name: idx_ventas_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ventas_cliente ON public.ventas USING btree (id_cliente);


--
-- TOC entry 5004 (class 1259 OID 25037)
-- Name: idx_ventas_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ventas_fecha ON public.ventas USING btree (fecha);


--
-- TOC entry 5005 (class 1259 OID 25035)
-- Name: idx_ventas_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ventas_usuario ON public.ventas USING btree (id_usuario);


--
-- TOC entry 5047 (class 2620 OID 25043)
-- Name: ventas trg_kardex_venta_cancel; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_kardex_venta_cancel AFTER UPDATE ON public.ventas FOR EACH ROW EXECUTE FUNCTION public.fn_automatizar_kardex_cancelacion();


--
-- TOC entry 5048 (class 2620 OID 25041)
-- Name: detalles_ventas trg_kardex_venta_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_kardex_venta_insert AFTER INSERT ON public.detalles_ventas FOR EACH ROW EXECUTE FUNCTION public.fn_automatizar_kardex_venta();


--
-- TOC entry 5039 (class 2606 OID 24989)
-- Name: cuentas_cobrar cuentas_cobrar_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id);


--
-- TOC entry 5040 (class 2606 OID 24994)
-- Name: cuentas_cobrar cuentas_cobrar_id_venta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.ventas(id);


--
-- TOC entry 5041 (class 2606 OID 25003)
-- Name: cuentas_pagar cuentas_pagar_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuentas_pagar
    ADD CONSTRAINT cuentas_pagar_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedores(id);


--
-- TOC entry 5033 (class 2606 OID 25012)
-- Name: detalles_tecnicos detalles_tecnicos_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_tecnicos
    ADD CONSTRAINT detalles_tecnicos_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5036 (class 2606 OID 24913)
-- Name: detalles_ventas detalles_ventas_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_ventas
    ADD CONSTRAINT detalles_ventas_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id);


--
-- TOC entry 5037 (class 2606 OID 24940)
-- Name: detalles_ventas detalles_ventas_id_venta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_ventas
    ADD CONSTRAINT detalles_ventas_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.ventas(id) ON DELETE CASCADE;


--
-- TOC entry 5045 (class 2606 OID 25075)
-- Name: detalles_pedidos fk_detalles_pedido; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_pedidos
    ADD CONSTRAINT fk_detalles_pedido FOREIGN KEY (id_pedido) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 5046 (class 2606 OID 25080)
-- Name: detalles_pedidos fk_detalles_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_pedidos
    ADD CONSTRAINT fk_detalles_producto FOREIGN KEY (id_producto) REFERENCES public.productos(id);


--
-- TOC entry 5044 (class 2606 OID 25057)
-- Name: pedidos fk_pedidos_cliente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT fk_pedidos_cliente FOREIGN KEY (id_cliente) REFERENCES public.clientes(id);


--
-- TOC entry 5042 (class 2606 OID 16679)
-- Name: perfil_opcion fkccootfr17pdgjedgifd92qao0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfil_opcion
    ADD CONSTRAINT fkccootfr17pdgjedgifd92qao0 FOREIGN KEY (id_opcion) REFERENCES public.opciones(id);


--
-- TOC entry 5043 (class 2606 OID 16684)
-- Name: perfil_opcion fke1pcyxsiyjjqt8g486euwsxft; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfil_opcion
    ADD CONSTRAINT fke1pcyxsiyjjqt8g486euwsxft FOREIGN KEY (id_perfil) REFERENCES public.perfiles(id);


--
-- TOC entry 5038 (class 2606 OID 24976)
-- Name: inventario inventario_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id);


--
-- TOC entry 5028 (class 2606 OID 16613)
-- Name: perfiles_opciones perfiles_opciones_id_opcion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfiles_opciones
    ADD CONSTRAINT perfiles_opciones_id_opcion_fkey FOREIGN KEY (id_opcion) REFERENCES public.opciones(id);


--
-- TOC entry 5029 (class 2606 OID 16633)
-- Name: perfiles_opciones perfiles_opciones_id_perfil_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfiles_opciones
    ADD CONSTRAINT perfiles_opciones_id_perfil_fkey FOREIGN KEY (id_perfil) REFERENCES public.perfiles(id);


--
-- TOC entry 5031 (class 2606 OID 16735)
-- Name: productos productos_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id);


--
-- TOC entry 5032 (class 2606 OID 16766)
-- Name: productos productos_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedores(id);


--
-- TOC entry 5030 (class 2606 OID 16665)
-- Name: usuarios usuarios_id_perfil_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_perfil_fkey FOREIGN KEY (id_perfil) REFERENCES public.perfiles(id);


--
-- TOC entry 5034 (class 2606 OID 24951)
-- Name: ventas ventas_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id);


--
-- TOC entry 5035 (class 2606 OID 24960)
-- Name: ventas ventas_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id);


-- Completed on 2026-06-02 08:47:21

--
-- PostgreSQL database dump complete
--

\unrestrict VOLIHJhc5MZMWeY3PPRcqB7jfqtkxywkskhskFv9SkK2bHesNPpPhfyWdfjwB67

