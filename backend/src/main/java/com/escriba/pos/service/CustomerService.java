package com.escriba.pos.service;

import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.Company;
import com.escriba.pos.model.entity.Customer;
import com.escriba.pos.model.entity.IdType;
import com.escriba.pos.repository.CompanyRepository;
import com.escriba.pos.repository.CustomerRepository;
import com.escriba.pos.repository.IdTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CompanyRepository companyRepository;
    private final IdTypeRepository idTypeRepository;

    @Transactional
    public Customer createCustomer(UUID companyId, String name, String documentNumber,
                                    String phone, String email, String address,
                                    String customerType, String documentTypeCode) {

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("Empresa no encontrada"));

        Customer customer = Customer.builder()
                .company(company)
                .name(name)
                .documentNumber(documentNumber)
                .phone(phone)
                .email(email)
                .address(address)
                .customerType(customerType != null ? customerType : "RETAIL")
                .active(true)
                .build();

        // Resolver tipo de documento
        if (documentTypeCode != null) {
            idTypeRepository.findByCode(documentTypeCode).ifPresent(customer::setDocumentType);
        }

        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());

        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(UUID id, UUID companyId, String name, String documentNumber,
                                    String phone, String email, String address,
                                    String customerType, String documentTypeCode,
                                    Boolean active) {

        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Cliente no encontrado"));

        if (name != null) existing.setName(name);
        if (documentNumber != null) existing.setDocumentNumber(documentNumber);
        if (phone != null) existing.setPhone(phone);
        if (email != null) existing.setEmail(email);
        if (address != null) existing.setAddress(address);
        if (customerType != null) existing.setCustomerType(customerType);
        if (active != null) existing.setActive(active);

        if (documentTypeCode != null) {
            idTypeRepository.findByCode(documentTypeCode).ifPresent(existing::setDocumentType);
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return customerRepository.save(existing);
    }
}
