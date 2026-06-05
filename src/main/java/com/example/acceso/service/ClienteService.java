package com.example.acceso.service;

import com.example.acceso.model.Cliente;
import com.example.acceso.repository.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Supplier;

@Service
public class ClienteService {
    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public List<Cliente> listarActivos() {
        return clienteRepository.findByEstado(1);
    }

    public Optional<Cliente> obtenerPorId(Long id) {
        return clienteRepository.findById(id);
    }

    public Optional<Cliente> obtenerPorDniRuc(String dniRuc) {
        return clienteRepository.findByDniRuc(dniRuc);
    }

    public Cliente guardar(Cliente cliente) {
        if (cliente.getEstado() == null) {
            cliente.setEstado(1);
        }
        return clienteRepository.save(cliente);
    }

    public static class ResultadoCliente {
        private final Cliente cliente;
        private final boolean creado;
        private final boolean actualizado;

        public ResultadoCliente(Cliente cliente, boolean creado, boolean actualizado) {
            this.cliente = cliente;
            this.creado = creado;
            this.actualizado = actualizado;
        }

        public Cliente getCliente() {
            return cliente;
        }

        public boolean isCreado() {
            return creado;
        }

        public boolean isActualizado() {
            return actualizado;
        }
    }

    public ResultadoCliente buscarOCrear(Cliente clienteInfo) {
        if (clienteInfo == null || clienteInfo.getDniRuc() == null || clienteInfo.getDniRuc().isBlank()) {
            throw new IllegalArgumentException("El DNI/RUC es obligatorio");
        }

        String dniRuc = clienteInfo.getDniRuc().trim();
        clienteInfo.setDniRuc(dniRuc);

        Optional<Cliente> existente = clienteRepository.findByDniRuc(dniRuc);
        boolean creado = existente.isEmpty();

        Cliente cliente = existente.orElseGet(() -> {
            Cliente nuevo = new Cliente();
            nuevo.setDniRuc(dniRuc);
            nuevo.setEstado(1);
            return nuevo;
        });

        boolean actualizado = false;
        actualizado |= actualizarSiHayDatoNuevo(cliente, clienteInfo.getNombre(), cliente::getNombre, cliente::setNombre);
        actualizado |= actualizarSiHayDatoNuevo(cliente, clienteInfo.getTelefono(), cliente::getTelefono, cliente::setTelefono);
        actualizado |= actualizarSiHayDatoNuevo(cliente, clienteInfo.getEmail(), cliente::getEmail, cliente::setEmail);
        actualizado |= actualizarSiHayDatoNuevo(cliente, clienteInfo.getDireccion(), cliente::getDireccion, cliente::setDireccion);

        if (!creado && Integer.valueOf(0).equals(cliente.getEstado())) {
            cliente.setEstado(1);
            actualizado = true;
        }
        if (cliente.getEstado() == null) {
            cliente.setEstado(1);
        }

        if (creado && (cliente.getNombre() == null || cliente.getNombre().isBlank())) {
            throw new IllegalArgumentException("El nombre del cliente es obligatorio");
        }

        Cliente guardado = clienteRepository.save(cliente);
        return new ResultadoCliente(guardado, creado, actualizado);
    }

    private boolean actualizarSiHayDatoNuevo(Cliente cliente, String valorNuevo,
                                            Supplier<String> getter, Consumer<String> setter) {
        if (valorNuevo == null || valorNuevo.isBlank()) {
            return false;
        }
        String limpio = valorNuevo.trim();
        if (!Objects.equals(limpio, getter.get())) {
            setter.accept(limpio);
            return true;
        }
        return false;
    }

    public void eliminar(Long id) {
        clienteRepository.findById(id).ifPresent(c -> {
            c.setEstado(0); // Borrado lógico
            clienteRepository.save(c);
        });
    }
}
