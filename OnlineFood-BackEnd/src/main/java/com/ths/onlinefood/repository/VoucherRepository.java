package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.Voucher;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByMaVoucher(String maVoucher);
    List<Voucher> findByTrangThai(Boolean trangThai);
}
