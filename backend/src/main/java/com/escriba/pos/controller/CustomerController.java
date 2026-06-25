package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.Customer;
import com.escriba.pos.repository.CustomerRepository;
import com.escriba.pos.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepository;
    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Customer>>> getAll(
            @RequestParam UUID companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                customerRepository.findByCompanyIdOrderByName(companyId,
                        PageRequest.of(page, size))));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Customer>>> getAllUnpaged(@RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(
                customerRepository.findByCompanyIdOrderByName(companyId)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Customer>>> search(
            @RequestParam UUID companyId,
            @RequestParam String term) {
        return ResponseEntity.ok(ApiResponse.success(
                customerRepository.searchByCompanyId(companyId, term)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                customerRepository.findById(id).orElse(null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Customer>> create(@RequestBody Map<String, Object> body) {
        Customer customer = customerService.createCustomer(
                UUID.fromString(body.get("companyId").toString()),
                (String) body.get("name"),
                (String) body.get("documentNumber"),
                (String) body.get("phone"),
                (String) body.get("email"),
                (String) body.get("address"),
                (String) body.get("customerType"),
                (String) body.get("documentType")
        );
        return ResponseEntity.ok(ApiResponse.success("Cliente creado exitosamente", customer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> update(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {

        Customer customer = customerService.updateCustomer(
                id,
                body.containsKey("companyId") ? UUID.fromString(body.get("companyId").toString()) : null,
                (String) body.get("name"),
                (String) body.get("documentNumber"),
                (String) body.get("phone"),
                (String) body.get("email"),
                (String) body.get("address"),
                (String) body.get("customerType"),
                (String) body.get("documentType"),
                body.containsKey("active") ? (Boolean) body.get("active") : null
        );
        return ResponseEntity.ok(ApiResponse.success("Cliente actualizado", customer));
    }
}
