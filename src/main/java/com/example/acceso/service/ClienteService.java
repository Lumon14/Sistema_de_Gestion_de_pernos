package com.example.acceso.service;

import com.example.acceso.model.Cliente;
import com.example.acceso.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

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

    public void eliminar(Long id) {
        clienteRepository.findById(id).ifPresent(c -> {
            c.setEstado(0); // Borrado lógico
            clienteRepository.save(c);
        });
    }
}
