package com.emart.service;

import com.emart.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private final Path root;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory", e);
        }
    }

    /** Stores an image and returns the public URL path (e.g. /uploads/abc.png). */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file uploaded.");
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = original.contains(".")
                ? original.substring(original.lastIndexOf('.') + 1).toLowerCase()
                : "";
        if (!ALLOWED.contains(ext)) {
            throw ApiException.badRequest("Only image files (jpg, png, webp, gif) are allowed.");
        }
        String filename = UUID.randomUUID() + "." + ext;
        try {
            Files.copy(file.getInputStream(), root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw ApiException.badRequest("Failed to store the uploaded file.");
        }
        return "/uploads/" + filename;
    }
}
