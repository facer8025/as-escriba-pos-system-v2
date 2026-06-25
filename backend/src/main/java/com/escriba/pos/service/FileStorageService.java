package com.escriba.pos.service;

import com.escriba.pos.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final long MAX_FILE_SIZE = 200 * 1024; // 200KB

    private final Path uploadDir;

    public FileStorageService(@Value("${app.upload.path:./uploads}") String uploadPath) {
        this.uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadDir);
            log.info("Directorio de subidas inicializado: {}", uploadDir);
        } catch (IOException e) {
            throw new BusinessException("No se pudo crear el directorio de subidas: " + uploadDir);
        }
    }

    /**
     * Guarda un archivo en el disco y devuelve la URL relativa de acceso.
     */
    public String storeFile(MultipartFile file) {
        // Validar que no esté vacío
        if (file.isEmpty()) {
            throw new BusinessException("El archivo está vacío");
        }

        // Validar tamaño
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("El archivo excede el tamaño máximo de 200KB");
        }

        // Validar extensión
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new BusinessException("El archivo no tiene una extensión válida");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException("Solo se permiten archivos JPG, PNG y WEBP");
        }

        // Generar nombre único
        String storedFilename = UUID.randomUUID() + "." + extension;
        Path targetPath = uploadDir.resolve(storedFilename);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Archivo guardado: {}", targetPath);
            return "/uploads/" + storedFilename;
        } catch (IOException e) {
            throw new BusinessException("Error al guardar el archivo: " + e.getMessage());
        }
    }

    /**
     * Elimina un archivo del disco dada su URL relativa.
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;

        String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
        Path targetPath = uploadDir.resolve(filename);

        try {
            Files.deleteIfExists(targetPath);
            log.info("Archivo eliminado: {}", targetPath);
        } catch (IOException e) {
            log.warn("No se pudo eliminar el archivo {}: {}", targetPath, e.getMessage());
        }
    }

    /**
     * Carga un archivo como Resource.
     */
    public Resource loadFileAsResource(String fileUrl) {
        String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
        Path filePath = uploadDir.resolve(filename).normalize();

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BusinessException("Archivo no encontrado: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new BusinessException("Error al leer el archivo: " + filename);
        }
    }
}
