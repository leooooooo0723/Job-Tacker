package com.jobtracker.repository.mysql;

import com.jobtracker.entity.mysql.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, String> {
    List<Company> findAllByOrderByNameAsc();
    Optional<Company> findByName(String name);
    boolean existsByName(String name);
    List<Company> findByNameContaining(String name);
}
